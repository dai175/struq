import { createServerFn } from "@tanstack/react-start";
import { getDb, schema } from "@/db";
import { eq, and, isNull, sql, max } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { requireUser, now } from "@/server/helpers";
import type { Database } from "@/db";

// ─── Types ──────────────────────────────────────────────

export type SetlistRow = Omit<
  typeof schema.setlists.$inferSelect,
  "userId" | "deletedAt"
>;

export type SetlistWithSongCount = SetlistRow & { songCount: number };

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

// ─── listSetlists ──────────────────────────────────────

export const listSetlists = createServerFn({ method: "GET" }).handler(
  async (): Promise<SetlistWithSongCount[]> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const rows = await db
      .select({
        ...setlistColumns,
        songCount: sql<number>`(
          SELECT COUNT(*) FROM setlist_songs
          WHERE setlist_songs.setlist_id = ${schema.setlists.id}
        )`.as("song_count"),
      })
      .from(schema.setlists)
      .where(
        and(
          eq(schema.setlists.userId, user.userId),
          isNull(schema.setlists.deletedAt),
        ),
      )
      .orderBy(schema.setlists.sortOrder);

    return rows;
  },
);

// ─── getSetlist ────────────────────────────────────────

export const getSetlist = createServerFn({ method: "GET" })
  .inputValidator((input: { setlistId: string }) => input)
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
        .innerJoin(
          schema.songs,
          eq(schema.setlistSongs.songId, schema.songs.id),
        )
        .where(
          and(
            eq(schema.setlistSongs.setlistId, data.setlistId),
            isNull(schema.songs.deletedAt),
          ),
        )
        .orderBy(schema.setlistSongs.sortOrder);

      return { setlist, songs };
    },
  );

// ─── createSetlist ─────────────────────────────────────

export const createSetlist = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      title: string;
      description?: string;
      sessionDate?: string;
      venue?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    const [result] = await db
      .select({ maxOrder: max(schema.setlists.sortOrder) })
      .from(schema.setlists)
      .where(
        and(
          eq(schema.setlists.userId, user.userId),
          isNull(schema.setlists.deletedAt),
        ),
      );
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

// ─── updateSetlist ─────────────────────────────────────

export const updateSetlist = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      title: string;
      description?: string;
      sessionDate?: string;
      venue?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    await db
      .update(schema.setlists)
      .set({
        title,
        description: data.description?.trim() || null,
        sessionDate: data.sessionDate?.trim() || null,
        venue: data.venue?.trim() || null,
        updatedAt: now(),
      })
      .where(
        and(
          eq(schema.setlists.id, data.id),
          eq(schema.setlists.userId, user.userId),
          isNull(schema.setlists.deletedAt),
        ),
      );
  });

// ─── deleteSetlist ─────────────────────────────────────

export const deleteSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
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

    await db.transaction(async (tx) => {
      await tx
        .update(schema.setlists)
        .set({ deletedAt: now() })
        .where(eq(schema.setlists.id, data.id));
      await tx
        .delete(schema.setlistSongs)
        .where(eq(schema.setlistSongs.setlistId, data.id));
    });
  });

// ─── addSongToSetlist ──────────────────────────────────

export const addSongToSetlist = createServerFn({ method: "POST" })
  .inputValidator((input: { setlistId: string; songId: string }) => input)
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
  .inputValidator((input: { setlistId: string; songId: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    await requireSetlistOwner(db, data.setlistId, user.userId);

    await db
      .delete(schema.setlistSongs)
      .where(
        and(
          eq(schema.setlistSongs.setlistId, data.setlistId),
          eq(schema.setlistSongs.songId, data.songId),
        ),
      );
  });

// ─── reorderSetlistSongs ───────────────────────────────

export const reorderSetlistSongs = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { setlistId: string; songIds: string[] }) => input,
  )
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    await requireSetlistOwner(db, data.setlistId, user.userId);

    // Delete all existing entries
    await db
      .delete(schema.setlistSongs)
      .where(eq(schema.setlistSongs.setlistId, data.setlistId));

    // Re-insert with new sortOrder + update timestamp in parallel
    const insertSongs =
      data.songIds.length > 0
        ? db.insert(schema.setlistSongs).values(
            data.songIds.map((songId, index) => ({
              setlistId: data.setlistId,
              songId,
              sortOrder: index,
            })),
          )
        : Promise.resolve();

    await Promise.all([
      insertSongs,
      db
        .update(schema.setlists)
        .set({ updatedAt: now() })
        .where(eq(schema.setlists.id, data.setlistId)),
    ]);
  });

// ─── listSongsForPicker ───────────────────────────────

export const listSongsForPicker = createServerFn({ method: "GET" })
  .inputValidator((input: { setlistId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ id: string; title: string; artist: string | null }[]> => {
      const user = await requireUser();
      const db = getDb(env.DB);

      const songs = await db
        .select({
          id: schema.songs.id,
          title: schema.songs.title,
          artist: schema.songs.artist,
        })
        .from(schema.songs)
        .where(
          and(
            eq(schema.songs.userId, user.userId),
            isNull(schema.songs.deletedAt),
            sql`${schema.songs.id} NOT IN (
              SELECT ${schema.setlistSongs.songId}
              FROM ${schema.setlistSongs}
              WHERE ${schema.setlistSongs.setlistId} = ${data.setlistId}
            )`,
          ),
        )
        .orderBy(schema.songs.title);

      return songs;
    },
  );
