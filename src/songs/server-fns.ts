import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { SECTION_TYPES, type SectionType } from "@/i18n/types";
import { logger } from "@/lib/logger";
import { checkAiRateLimit, RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import { isValidUrl } from "@/lib/validation";
import { now, requireUser } from "@/server/helpers";
import type { SectionData } from "@/songs/components/SectionCard";
import { DEFAULT_BARS } from "@/songs/constants";

// ─── Types ──────────────────────────────────────────────

export type SongRow = Omit<typeof schema.songs.$inferSelect, "userId" | "deletedAt">;

export type SectionRow = Omit<typeof schema.sections.$inferSelect, "deletedAt">;

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

const LIST_SONGS_LIMIT = 30;

export const listSongs = createServerFn({ method: "GET" })
  .inputValidator((input: { offset?: number } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<{ items: { song: SongRow; sections: SectionRow[] }[]; hasMore: boolean }> => {
    const user = await requireUser();
    const db = getDb(env.DB);
    const offset = Math.max(0, data.offset ?? 0);

    const rows = await db
      .select(songColumns)
      .from(schema.songs)
      .where(and(eq(schema.songs.userId, user.userId), isNull(schema.songs.deletedAt)))
      .orderBy(desc(schema.songs.updatedAt))
      .limit(LIST_SONGS_LIMIT + 1)
      .offset(offset);

    const hasMore = rows.length > LIST_SONGS_LIMIT;
    const songs = hasMore ? rows.slice(0, LIST_SONGS_LIMIT) : rows;

    if (songs.length === 0) return { items: [], hasMore: false };

    const songIds = songs.map((s) => s.id);
    const allSections = await db
      .select(sectionColumns)
      .from(schema.sections)
      .where(and(inArray(schema.sections.songId, songIds), isNull(schema.sections.deletedAt)))
      .orderBy(schema.sections.sortOrder);

    const sectionsBySong = new Map<string, SectionRow[]>();
    for (const sec of allSections) {
      const list = sectionsBySong.get(sec.songId) ?? [];
      list.push(sec);
      sectionsBySong.set(sec.songId, list);
    }

    return {
      items: songs.map((song) => ({ song, sections: sectionsBySong.get(song.id) ?? [] })),
      hasMore,
    };
  });

// ─── getSongWithSections ────────────────────────────────

export const getSongWithSections = createServerFn({ method: "GET" })
  .inputValidator((input: { songId: string }) => input)
  .handler(async ({ data }): Promise<{ song: SongRow; sections: SectionRow[] } | null> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const [song] = await db
      .select(songColumns)
      .from(schema.songs)
      .where(
        and(eq(schema.songs.id, data.songId), eq(schema.songs.userId, user.userId), isNull(schema.songs.deletedAt)),
      )
      .limit(1);

    if (!song) return null;

    const sections = await db
      .select(sectionColumns)
      .from(schema.sections)
      .where(and(eq(schema.sections.songId, data.songId), isNull(schema.sections.deletedAt)))
      .orderBy(schema.sections.sortOrder);

    return { song, sections };
  });

// ─── createSong ─────────────────────────────────────────

export const createSong = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { title: string; artist?: string; bpm?: number; key?: string; referenceUrl?: string }) => input,
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
      referenceUrl: data.referenceUrl?.trim() && isValidUrl(data.referenceUrl.trim()) ? data.referenceUrl.trim() : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { id };
  });

// ─── updateSong ─────────────────────────────────────────

export const updateSong = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; title: string; artist?: string; bpm?: number; key?: string; referenceUrl?: string }) => input,
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
        referenceUrl:
          data.referenceUrl?.trim() && isValidUrl(data.referenceUrl.trim()) ? data.referenceUrl.trim() : null,
        updatedAt: now(),
      })
      .where(and(eq(schema.songs.id, data.id), eq(schema.songs.userId, user.userId), isNull(schema.songs.deletedAt)));
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
      where: and(eq(schema.songs.id, data.id), eq(schema.songs.userId, user.userId), isNull(schema.songs.deletedAt)),
    });
    if (!song) return;

    await Promise.all([
      db.update(schema.songs).set({ deletedAt: timestamp }).where(eq(schema.songs.id, data.id)),
      db
        .update(schema.sections)
        .set({ deletedAt: timestamp })
        .where(and(eq(schema.sections.songId, data.id), isNull(schema.sections.deletedAt))),
      db.delete(schema.setlistSongs).where(eq(schema.setlistSongs.songId, data.id)),
    ]);
  });

// ─── generateSections (AI) ──────────────────────────────

const KNOWN_SECTION_TYPES: ReadonlySet<string> = new Set(SECTION_TYPES.filter((t) => t !== "custom"));

function normalizeSection(raw: unknown): SectionData {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      id: crypto.randomUUID(),
      type: "custom",
      label: null,
      bars: DEFAULT_BARS.custom,
      extraBeats: 0,
      chordProgression: null,
      memo: null,
    };
  }
  const obj = raw as Record<string, unknown>;

  const rawType = typeof obj.type === "string" ? obj.type.toLowerCase() : "";
  const type: SectionType = KNOWN_SECTION_TYPES.has(rawType) ? (rawType as SectionType) : "custom";

  const rawBars = typeof obj.bars === "number" ? Math.floor(obj.bars) : Number.NaN;
  const bars = rawBars > 0 ? rawBars : DEFAULT_BARS[type];

  const rawExtra = typeof obj.extra_beats === "number" ? Math.floor(obj.extra_beats) : Number.NaN;
  const extraBeats = rawExtra >= 0 && rawExtra <= 7 ? rawExtra : 0;

  const chordProgression = typeof obj.chord_progression === "string" ? obj.chord_progression.trim() || null : null;

  return {
    id: crypto.randomUUID(),
    type,
    label: type === "custom" && typeof obj.type === "string" ? obj.type : null,
    bars,
    extraBeats,
    chordProgression,
    memo: null,
  };
}

export const generateSections = createServerFn({ method: "POST" })
  .inputValidator((input: { title: string; artist: string }) => input)
  .handler(async ({ data }): Promise<SectionData[]> => {
    const user = await requireUser();
    const db = getDb(env.DB);

    const allowed = await checkAiRateLimit(db, user.userId);
    if (!allowed) throw new Error(RATE_LIMIT_ERROR);

    const title = data.title.trim();
    if (!title) throw new Error("Title is required");

    const artist = data.artist.trim();
    const prompt = `Given the song "${title}"${artist ? ` by "${artist}"` : ""}, return the song structure as a JSON array.
Each element should have:
- "type": one of "intro", "a", "b", "chorus", "bridge", "solo", "outro", "interlude"
- "bars": number of bars (integer)
- "extra_beats": additional beats beyond the bar count (integer, 0 if none)
- "chord_progression": chord symbols separated by spaces (e.g. "Am F C G"), or null if unknown

Return ONLY valid JSON, no explanation.
Example: [{"type":"intro","bars":4,"extra_beats":0,"chord_progression":null},{"type":"a","bars":8,"extra_beats":2,"chord_progression":"Am F C G"}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Gemini API error", { status: response.status, body: errorBody });
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.error("No response from AI", { candidates: result.candidates?.length ?? 0 });
      throw new Error("No response from AI");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error("Invalid JSON response from AI", { raw: text.slice(0, 200) });
      throw new Error("Invalid JSON response from AI");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      logger.warn("AI returned empty or invalid structure", { parsed: JSON.stringify(parsed).slice(0, 200) });
      throw new Error("AI returned empty or invalid structure");
    }

    return parsed.slice(0, 50).map(normalizeSection);
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
      .where(and(eq(schema.sections.songId, data.songId), isNull(schema.sections.deletedAt)));

    // Insert new sections + update song timestamp in parallel
    const insertSections =
      data.sections.length > 0
        ? db.insert(schema.sections).values(
            data.sections.map((sec) => ({
              id: crypto.randomUUID(),
              songId: data.songId,
              type: sec.type,
              label: sec.type === "custom" ? sec.label?.trim() || null : null,
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
      db.update(schema.songs).set({ updatedAt: timestamp }).where(eq(schema.songs.id, data.songId)),
    ]);
  });
