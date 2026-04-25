import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull, max, or, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { getDb, schema } from "@/db";
import type { SectionType } from "@/i18n/types";
import {
  createSetlistInputSchema,
  createSetlistWithSongsInputSchema,
  deleteByIdInputSchema,
  listInputSchema,
  listSongsForPickerInputSchema,
  saveSetlistWithSongsInputSchema,
  setlistIdInputSchema,
  setlistSongPairInputSchema,
} from "@/lib/schemas";
import { escapeLikePattern } from "@/lib/sql-like";
import { now, requireUser } from "@/server/helpers";

// ─── Types ──────────────────────────────────────────────

export type SetlistRow = Omit<typeof schema.setlists.$inferSelect, "userId" | "deletedAt">;

export type SetlistWithSongCount = SetlistRow & {
  songCount: number;
  songStructure: SectionType[];
};

export type SetlistSongItem = {
  songId: string;
  title: string;
  artist: string | null;
  sortOrder: number;
};

// ─── Helpers ────────────────────────────────────────────

const setlistColumns = {
  id: schema.setlists.id,
  title: schema.setlists.title,
  description: schema.setlists.description,
  sessionDate: schema.setlists.sessionDate,
  venue: schema.setlists.venue,
  sortOrder: schema.setlists.sortOrder,
  createdAt: schema.setlists.createdAt,
  updatedAt: schema.setlists.updatedAt,
} as const;

async function requireSetlistOwner(db: Database, setlistId: string, userId: string) {
  const setlist = await db.query.setlists.findFirst({
    where: and(
      eq(schema.setlists.id, setlistId),
      eq(schema.setlists.userId, userId),
      isNull(schema.setlists.deletedAt),
    ),
  });
  if (!setlist) throw new Error("Setlist not found");
  return setlist;
}

// D1 limits bound parameters to 100 per statement. The ownership check combines
// inArray(songIds) with userId eq, so chunk songIds at 90 to stay under the limit
// even for the max input size (songIds.max = 500).
const SONGS_OWNERSHIP_CHECK_BATCH = 90;

async function verifySongsOwnership(db: Database, songIds: string[], userId: string): Promise<void> {
  if (songIds.length === 0) return;
  const uniqueIds = Array.from(new Set(songIds));
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += SONGS_OWNERSHIP_CHECK_BATCH) {
    chunks.push(uniqueIds.slice(i, i + SONGS_OWNERSHIP_CHECK_BATCH));
  }
  const results = await Promise.all(
    chunks.map((chunk) =>
      db
        .select({ id: schema.songs.id })
        .from(schema.songs)
        .where(and(inArray(schema.songs.id, chunk), eq(schema.songs.userId, userId), isNull(schema.songs.deletedAt))),
    ),
  );
  const ownedCount = results.reduce((n, rows) => n + rows.length, 0);
  if (ownedCount !== uniqueIds.length) {
    throw new Error("Song not found");
  }
}

// ─── listSetlists ──────────────────────────────────────

const LIST_SETLISTS_LIMIT = 30;

export const listSetlists = createServerFn({ method: "GET" })
  .inputValidator((input: { offset?: number; query?: string } | undefined) => listInputSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<{ items: SetlistWithSongCount[]; hasMore: boolean }> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const offset = Math.max(0, data.offset ?? 0);

    const baseWhere = and(eq(schema.setlists.userId, user.userId), isNull(schema.setlists.deletedAt));
    const whereClause = data.query
      ? and(
          baseWhere,
          (() => {
            const pattern = `%${escapeLikePattern(data.query)}%`;
            return or(
              sql`${schema.setlists.title} LIKE ${pattern} ESCAPE '\\'`,
              sql`${schema.setlists.venue} LIKE ${pattern} ESCAPE '\\'`,
            );
          })(),
        )
      : baseWhere;

    const rows = await db
      .select(setlistColumns)
      .from(schema.setlists)
      .where(whereClause)
      .orderBy(schema.setlists.sortOrder)
      .limit(LIST_SETLISTS_LIMIT + 1)
      .offset(offset);

    const hasMore = rows.length > LIST_SETLISTS_LIMIT;
    const page = hasMore ? rows.slice(0, LIST_SETLISTS_LIMIT) : rows;

    const structureMap = await loadSetlistSongStructures(
      db,
      page.map((r) => r.id),
    );
    const items: SetlistWithSongCount[] = page.map((r) => {
      const songStructure = structureMap.get(r.id) ?? [];
      return { ...r, songCount: songStructure.length, songStructure };
    });

    return { items, hasMore };
  });

/**
 * Each entry in the returned array is the first section's type of the song at
 * that position, defaulting to "intro" when the song has no sections yet.
 * Soft-deleted songs are excluded so the length equals the setlist's live
 * song count.
 */
async function loadSetlistSongStructures(db: Database, setlistIds: string[]): Promise<Map<string, SectionType[]>> {
  const map = new Map<string, SectionType[]>();
  if (setlistIds.length === 0) return map;

  const rows = await db
    .select({
      setlistId: schema.setlistSongs.setlistId,
      sortOrder: schema.setlistSongs.sortOrder,
      type: schema.sections.type,
    })
    .from(schema.setlistSongs)
    .innerJoin(schema.songs, and(eq(schema.songs.id, schema.setlistSongs.songId), isNull(schema.songs.deletedAt)))
    .leftJoin(
      schema.sections,
      and(
        eq(schema.sections.songId, schema.setlistSongs.songId),
        isNull(schema.sections.deletedAt),
        sql`${schema.sections.sortOrder} = (
          SELECT MIN(sort_order) FROM sections
          WHERE song_id = ${schema.setlistSongs.songId} AND deleted_at IS NULL
        )`,
      ),
    )
    .where(inArray(schema.setlistSongs.setlistId, setlistIds))
    .orderBy(schema.setlistSongs.setlistId, schema.setlistSongs.sortOrder);

  for (const row of rows) {
    const arr = map.get(row.setlistId) ?? [];
    arr.push((row.type as SectionType | null) ?? "intro");
    map.set(row.setlistId, arr);
  }
  return map;
}

// ─── getSetlist ────────────────────────────────────────

export const getSetlist = createServerFn({ method: "GET" })
  .inputValidator((input: { setlistId: string }) => setlistIdInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      setlist: SetlistRow;
      songs: SetlistSongItem[];
    } | null> => {
      const user = await requireUser();
      const db = getDb(env.DB);

      const [setlist] = await db
        .select(setlistColumns)
        .from(schema.setlists)
        .where(
          and(
            eq(schema.setlists.id, data.setlistId),
            eq(schema.setlists.userId, user.userId),
            isNull(schema.setlists.deletedAt),
          ),
        )
        .limit(1);

      if (!setlist) return null;

      const songs = await db
        .select({
          songId: schema.setlistSongs.songId,
          title: schema.songs.title,
          artist: schema.songs.artist,
          sortOrder: schema.setlistSongs.sortOrder,
        })
        .from(schema.setlistSongs)
        .innerJoin(schema.songs, eq(schema.setlistSongs.songId, schema.songs.id))
        .where(and(eq(schema.setlistSongs.setlistId, data.setlistId), isNull(schema.songs.deletedAt)))
        .orderBy(schema.setlistSongs.sortOrder);

      return { setlist, songs };
    },
  );

// ─── createSetlist ─────────────────────────────────────

export const createSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { title: string; description?: string; sessionDate?: string; venue?: string }) =>
    createSetlistInputSchema.parse(input),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    const [result] = await db
      .select({ maxOrder: max(schema.setlists.sortOrder) })
      .from(schema.setlists)
      .where(and(eq(schema.setlists.userId, user.userId), isNull(schema.setlists.deletedAt)));
    const sortOrder = (result?.maxOrder ?? -1) + 1;

    const id = crypto.randomUUID();
    const timestamp = now();

    await db.insert(schema.setlists).values({
      id,
      userId: user.userId,
      title,
      description: data.description?.trim() || null,
      sessionDate: data.sessionDate?.trim() || null,
      venue: data.venue?.trim() || null,
      sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { id };
  });

// ─── createSetlistWithSongs ────────────────────────────

export const createSetlistWithSongs = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { title: string; description?: string; sessionDate?: string; venue?: string; songIds: string[] }) =>
      createSetlistWithSongsInputSchema.parse(input),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const timestamp = now();

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    const [, [maxOrderResult]] = await Promise.all([
      verifySongsOwnership(db, data.songIds, user.userId),
      db
        .select({ maxOrder: max(schema.setlists.sortOrder) })
        .from(schema.setlists)
        .where(and(eq(schema.setlists.userId, user.userId), isNull(schema.setlists.deletedAt))),
    ]);

    const sortOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const setlistId = crypto.randomUUID();

    // Executes as a single batched request (not a true ACID transaction —
    // D1 does not support BEGIN/COMMIT semantics; prior statements in the
    // batch are not rolled back if a later one fails).
    const insertSongStatements = [];
    for (let i = 0; i < data.songIds.length; i += SETLIST_SONGS_INSERT_BATCH) {
      insertSongStatements.push(
        db.insert(schema.setlistSongs).values(
          data.songIds.slice(i, i + SETLIST_SONGS_INSERT_BATCH).map((songId, j) => ({
            setlistId,
            songId,
            sortOrder: i + j,
          })),
        ),
      );
    }

    await db.batch([
      db.insert(schema.setlists).values({
        id: setlistId,
        userId: user.userId,
        title,
        description: data.description?.trim() || null,
        sessionDate: data.sessionDate?.trim() || null,
        venue: data.venue?.trim() || null,
        sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      ...insertSongStatements,
    ] as Parameters<typeof db.batch>[0]);

    return { id: setlistId };
  });

// ─── deleteSetlist ─────────────────────────────────────

export const deleteSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => deleteByIdInputSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const setlist = await db.query.setlists.findFirst({
      where: and(
        eq(schema.setlists.id, data.id),
        eq(schema.setlists.userId, user.userId),
        isNull(schema.setlists.deletedAt),
      ),
    });
    if (!setlist) return;

    // Executes as a single batched request (not a true ACID transaction —
    // D1 does not support BEGIN/COMMIT semantics; prior statements in the
    // batch are not rolled back if a later one fails).
    await db.batch([
      db.update(schema.setlists).set({ deletedAt: now() }).where(eq(schema.setlists.id, data.id)),
      db.delete(schema.setlistSongs).where(eq(schema.setlistSongs.setlistId, data.id)),
    ] as Parameters<typeof db.batch>[0]);
  });

// ─── addSongToSetlist ──────────────────────────────────

export const addSongToSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { setlistId: string; songId: string }) => setlistSongPairInputSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    // Verify ownership + get max sortOrder in parallel
    const [, song, [sortResult]] = await Promise.all([
      requireSetlistOwner(db, data.setlistId, user.userId),
      db.query.songs.findFirst({
        where: and(
          eq(schema.songs.id, data.songId),
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
        ),
      }),
      db
        .select({ maxOrder: max(schema.setlistSongs.sortOrder) })
        .from(schema.setlistSongs)
        .where(eq(schema.setlistSongs.setlistId, data.setlistId)),
    ]);
    if (!song) throw new Error("Song not found");

    const sortOrder = (sortResult?.maxOrder ?? -1) + 1;

    await db
      .insert(schema.setlistSongs)
      .values({
        setlistId: data.setlistId,
        songId: data.songId,
        sortOrder,
      })
      .onConflictDoNothing();
  });

// ─── removeSongFromSetlist ─────────────────────────────

export const removeSongFromSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { setlistId: string; songId: string }) => setlistSongPairInputSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    await requireSetlistOwner(db, data.setlistId, user.userId);

    await db
      .delete(schema.setlistSongs)
      .where(and(eq(schema.setlistSongs.setlistId, data.setlistId), eq(schema.setlistSongs.songId, data.songId)));
  });

// D1 limits bound parameters to 100 per statement; setlist_songs has 3 columns
// (setlistId, songId, sortOrder), so batch at 30 rows (90 params) to stay under the limit.
const SETLIST_SONGS_INSERT_BATCH = 30;

// ─── saveSetlistWithSongs ──────────────────────────────

export const saveSetlistWithSongs = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      title: string;
      description?: string;
      sessionDate?: string;
      venue?: string;
      songIds: string[];
    }) => saveSetlistWithSongsInputSchema.parse(input),
  )
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const timestamp = now();

    await Promise.all([
      requireSetlistOwner(db, data.id, user.userId),
      verifySongsOwnership(db, data.songIds, user.userId),
    ]);

    // Executes as a single batched request (not a true ACID transaction —
    // D1 does not support BEGIN/COMMIT semantics; prior statements in the
    // batch are not rolled back if a later one fails).
    const insertStatements = [];
    for (let i = 0; i < data.songIds.length; i += SETLIST_SONGS_INSERT_BATCH) {
      insertStatements.push(
        db.insert(schema.setlistSongs).values(
          data.songIds.slice(i, i + SETLIST_SONGS_INSERT_BATCH).map((songId, j) => ({
            setlistId: data.id,
            songId,
            sortOrder: i + j,
          })),
        ),
      );
    }

    await db.batch([
      db
        .update(schema.setlists)
        .set({
          title: data.title,
          description: data.description?.trim() || null,
          sessionDate: data.sessionDate?.trim() || null,
          venue: data.venue?.trim() || null,
          updatedAt: timestamp,
        })
        .where(
          and(
            eq(schema.setlists.id, data.id),
            eq(schema.setlists.userId, user.userId),
            isNull(schema.setlists.deletedAt),
          ),
        ),
      db.delete(schema.setlistSongs).where(eq(schema.setlistSongs.setlistId, data.id)),
      ...insertStatements,
    ] as Parameters<typeof db.batch>[0]);
  });

// ─── listSongsForPicker ──────────────────────────────

// The picker has no pagination UI, so cap the response to avoid huge payloads
// for large libraries. Users with more matches are expected to narrow via search.
const PICKER_SONG_LIMIT = 100;

export const listSongsForPicker = createServerFn({ method: "GET" })
  .inputValidator((input: { setlistId?: string; query?: string }) => listSongsForPickerInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ id: string; title: string; artist: string | null }[]> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    if (data.setlistId) {
      await requireSetlistOwner(db, data.setlistId, user.userId);
    }

    // When setlistId is omitted (new setlist flow), skip the NOT IN subquery —
    // the client de-duplicates against the in-memory song list instead.
    const baseScope = data.setlistId
      ? and(
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
          sql`${schema.songs.id} NOT IN (
            SELECT ${schema.setlistSongs.songId}
            FROM ${schema.setlistSongs}
            WHERE ${schema.setlistSongs.setlistId} = ${data.setlistId}
          )`,
        )
      : and(eq(schema.songs.userId, user.userId), isNull(schema.songs.deletedAt));
    let whereClause = baseScope;
    if (data.query) {
      const pattern = `%${escapeLikePattern(data.query)}%`;
      whereClause = and(
        baseScope,
        or(
          sql`${schema.songs.title} LIKE ${pattern} ESCAPE '\\'`,
          sql`${schema.songs.artist} LIKE ${pattern} ESCAPE '\\'`,
        ),
      );
    }

    const songs = await db
      .select({
        id: schema.songs.id,
        title: schema.songs.title,
        artist: schema.songs.artist,
      })
      .from(schema.songs)
      .where(whereClause)
      .orderBy(schema.songs.title)
      .limit(PICKER_SONG_LIMIT);

    return songs;
  });
