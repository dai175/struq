import { createServerFn } from "@tanstack/react-start";
import { getAuthUser } from "@/auth/server-fns";
import { getDb, schema } from "@/db";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import type { SectionType } from "@/i18n/types";

// ─── Types ──────────────────────────────────────────────

export interface SongRow {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  key: string | null;
  referenceUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SectionRow {
  id: string;
  songId: string;
  type: SectionType;
  label: string | null;
  bars: number;
  extraBeats: number;
  chordProgression: string | null;
  memo: string | null;
  sortOrder: number;
}

// ─── Helpers ────────────────────────────────────────────

async function requireUser() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

// ─── listSongs ──────────────────────────────────────────

export const listSongs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ song: SongRow; sections: SectionRow[] }[]> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const songs = await db
      .select()
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
      .select()
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
      list.push(sec as SectionRow);
      sectionsBySong.set(sec.songId, list);
    }

    return songs.map((song) => ({
      song: song as SongRow,
      sections: sectionsBySong.get(song.id) ?? [],
    }));
  },
);

// ─── getSongWithSections ────────────────────────────────

export const getSongWithSections = createServerFn({ method: "GET" })
  .validator((input: { songId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ song: SongRow; sections: SectionRow[] } | null> => {
      const user = await requireUser();
      const db = getDb(env.DB);

      const song = await db.query.songs.findFirst({
        where: and(
          eq(schema.songs.id, data.songId),
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
        ),
      });

      if (!song) return null;

      const sections = await db
        .select()
        .from(schema.sections)
        .where(
          and(
            eq(schema.sections.songId, data.songId),
            isNull(schema.sections.deletedAt),
          ),
        )
        .orderBy(schema.sections.sortOrder);

      return {
        song: song as SongRow,
        sections: sections as SectionRow[],
      };
    },
  );

// ─── createSong ─────────────────────────────────────────

export const createSong = createServerFn({ method: "POST" })
  .validator(
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
  .validator(
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
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const timestamp = now();

    // Soft-delete the song
    await db
      .update(schema.songs)
      .set({ deletedAt: timestamp })
      .where(
        and(
          eq(schema.songs.id, data.id),
          eq(schema.songs.userId, user.userId),
          isNull(schema.songs.deletedAt),
        ),
      );

    // Soft-delete all sections
    await db
      .update(schema.sections)
      .set({ deletedAt: timestamp })
      .where(
        and(
          eq(schema.sections.songId, data.id),
          isNull(schema.sections.deletedAt),
        ),
      );

    // Physically delete setlist-song associations
    await db
      .delete(schema.setlistSongs)
      .where(eq(schema.setlistSongs.songId, data.id));
  });

// ─── saveSections ───────────────────────────────────────

export const saveSections = createServerFn({ method: "POST" })
  .validator(
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

    // Insert new sections
    if (data.sections.length > 0) {
      await db.insert(schema.sections).values(
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
      );
    }

    // Update song timestamp
    await db
      .update(schema.songs)
      .set({ updatedAt: timestamp })
      .where(eq(schema.songs.id, data.songId));
  });
