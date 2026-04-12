import { createServerFn } from "@tanstack/react-start";
import { getAuthUser } from "@/auth/server-fns";
import { getDb, schema } from "@/db";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import type { SectionType } from "@/i18n/types";

// ─── Types ──────────────────────────────────────────────

export type SongRow = Omit<
  typeof schema.songs.$inferSelect,
  "userId" | "deletedAt"
>;

export type SectionRow = Omit<
  typeof schema.sections.$inferSelect,
  "deletedAt"
>;

// ─── Helpers ────────────────────────────────────────────

async function requireUser() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

const songColumns = {
  id: schema.songs.id,
  title: schema.songs.title,
  artist: schema.songs.artist,
  bpm: schema.songs.bpm,
  key: schema.songs.key,
  referenceUrl: schema.songs.referenceUrl,
  createdAt: schema.songs.createdAt,
  updatedAt: schema.songs.updatedAt,
} as const;

const sectionColumns = {
  id: schema.sections.id,
  songId: schema.sections.songId,
  type: schema.sections.type,
  label: schema.sections.label,
  bars: schema.sections.bars,
  extraBeats: schema.sections.extraBeats,
  chordProgression: schema.sections.chordProgression,
  memo: schema.sections.memo,
  sortOrder: schema.sections.sortOrder,
} as const;

// ─── listSongs ──────────────────────────────────────────

export const listSongs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ song: SongRow; sections: SectionRow[] }[]> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const songs = await db
      .select(songColumns)
      .from(schema.songs)
      .where(
        and(
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
        ),
      )
      .orderBy(desc(schema.songs.updatedAt));

    if (songs.length === 0) return [];

    const songIds = songs.map((s) => s.id);
    const allSections = await db
      .select(sectionColumns)
      .from(schema.sections)
      .where(
        and(
          inArray(schema.sections.songId, songIds),
          isNull(schema.sections.deletedAt),
        ),
      )
      .orderBy(schema.sections.sortOrder);

    const sectionsBySong = new Map<string, SectionRow[]>();
    for (const sec of allSections) {
      const list = sectionsBySong.get(sec.songId) ?? [];
      list.push(sec);
      sectionsBySong.set(sec.songId, list);
    }

    return songs.map((song) => ({
      song,
      sections: sectionsBySong.get(song.id) ?? [],
    }));
  },
);

// ─── getSongWithSections ────────────────────────────────

export const getSongWithSections = createServerFn({ method: "GET" })
  .inputValidator((input: { songId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ song: SongRow; sections: SectionRow[] } | null> => {
      const user = await requireUser();
      const db = getDb(env.DB);

      const [song] = await db
        .select(songColumns)
        .from(schema.songs)
        .where(
          and(
            eq(schema.songs.id, data.songId),
            eq(schema.songs.userId, user.userId),
            isNull(schema.songs.deletedAt),
          ),
        )
        .limit(1);

      if (!song) return null;

      const sections = await db
        .select(sectionColumns)
        .from(schema.sections)
        .where(
          and(
            eq(schema.sections.songId, data.songId),
            isNull(schema.sections.deletedAt),
          ),
        )
        .orderBy(schema.sections.sortOrder);

      return { song, sections };
    },
  );

// ─── createSong ─────────────────────────────────────────

export const createSong = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      title: string;
      artist?: string;
      bpm?: number;
      key?: string;
      referenceUrl?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    const id = crypto.randomUUID();
    const timestamp = now();

    await db.insert(schema.songs).values({
      id,
      userId: user.userId,
      title,
      artist: data.artist?.trim() || null,
      bpm: data.bpm ?? null,
      key: data.key?.trim() || null,
      referenceUrl: data.referenceUrl?.trim() || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { id };
  });

// ─── updateSong ─────────────────────────────────────────

export const updateSong = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      title: string;
      artist?: string;
      bpm?: number;
      key?: string;
      referenceUrl?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    await db
      .update(schema.songs)
      .set({
        title,
        artist: data.artist?.trim() || null,
        bpm: data.bpm ?? null,
        key: data.key?.trim() || null,
        referenceUrl: data.referenceUrl?.trim() || null,
        updatedAt: now(),
      })
      .where(
        and(
          eq(schema.songs.id, data.id),
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
        ),
      );
  });

// ─── deleteSong ─────────────────────────────────────────

export const deleteSong = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const timestamp = now();

    // Verify ownership before any deletion
    const song = await db.query.songs.findFirst({
      where: and(
        eq(schema.songs.id, data.id),
        eq(schema.songs.userId, user.userId),
        isNull(schema.songs.deletedAt),
      ),
    });
    if (!song) return;

    await Promise.all([
      db
        .update(schema.songs)
        .set({ deletedAt: timestamp })
        .where(eq(schema.songs.id, data.id)),
      db
        .update(schema.sections)
        .set({ deletedAt: timestamp })
        .where(
          and(
            eq(schema.sections.songId, data.id),
            isNull(schema.sections.deletedAt),
          ),
        ),
      db
        .delete(schema.setlistSongs)
        .where(eq(schema.setlistSongs.songId, data.id)),
    ]);
  });

// ─── saveSections ───────────────────────────────────────

export const saveSections = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      songId: string;
      sections: Array<{
        type: SectionType;
        label?: string | null;
        bars: number;
        extraBeats: number;
        chordProgression?: string | null;
        memo?: string | null;
        sortOrder: number;
      }>;
    }) => input,
  )
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const timestamp = now();

    // Verify song ownership
    const song = await db.query.songs.findFirst({
      where: and(
        eq(schema.songs.id, data.songId),
        eq(schema.songs.userId, user.userId),
        isNull(schema.songs.deletedAt),
      ),
    });
    if (!song) throw new Error("Song not found");

    // Soft-delete existing sections
    await db
      .update(schema.sections)
      .set({ deletedAt: timestamp })
      .where(
        and(
          eq(schema.sections.songId, data.songId),
          isNull(schema.sections.deletedAt),
        ),
      );

    // Insert new sections + update song timestamp in parallel
    const insertSections =
      data.sections.length > 0
        ? db.insert(schema.sections).values(
            data.sections.map((sec) => ({
              id: crypto.randomUUID(),
              songId: data.songId,
              type: sec.type,
              label: sec.type === "custom" ? (sec.label?.trim() || null) : null,
              bars: sec.bars,
              extraBeats: sec.extraBeats,
              chordProgression: sec.chordProgression?.trim() || null,
              memo: sec.memo?.trim() || null,
              sortOrder: sec.sortOrder,
            })),
          )
        : Promise.resolve();

    await Promise.all([
      insertSections,
      db
        .update(schema.songs)
        .set({ updatedAt: timestamp })
        .where(eq(schema.songs.id, data.songId)),
    ]);
  });
