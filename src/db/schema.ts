import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { LOCALES, SECTION_TYPES } from "../i18n/types";

// ─── Users ──────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  locale: text("locale", { enum: LOCALES }).notNull().default("ja"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "number" }),
});

// ─── Songs ──────────────────────────────────────────────
export const songs = sqliteTable(
  "songs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    artist: text("artist"),
    bpm: integer("bpm"),
    key: text("key"),
    referenceUrl: text("reference_url"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("songs_user_id_idx").on(table.userId),
    index("songs_user_deleted_updated_idx").on(table.userId, table.deletedAt, table.updatedAt),
  ],
);

// ─── Setlists ───────────────────────────────────────────
export const setlists = sqliteTable(
  "setlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sessionDate: text("session_date"),
    venue: text("venue"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("setlists_user_id_idx").on(table.userId),
    index("setlists_user_deleted_sort_idx").on(table.userId, table.deletedAt, table.sortOrder),
  ],
);

// ─── SetlistSongs (junction) ────────────────────────────
export const setlistSongs = sqliteTable(
  "setlist_songs",
  {
    setlistId: text("setlist_id")
      .notNull()
      .references(() => setlists.id, { onDelete: "cascade" }),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.setlistId, table.songId] }),
    uniqueIndex("setlist_songs_setlist_sort_unique").on(table.setlistId, table.sortOrder),
  ],
);

// ─── AI Rate Limits ─────────────────────────────────────
export const aiRateLimits = sqliteTable("ai_rate_limits", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  lastCalledAt: integer("last_called_at", { mode: "number" }).notNull(),
});

// ─── Sections ───────────────────────────────────────────
export const sections = sqliteTable(
  "sections",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    type: text("type", { enum: SECTION_TYPES }).notNull(),
    label: text("label"),
    bars: integer("bars").notNull().default(8),
    extraBeats: integer("extra_beats").notNull().default(0),
    chordProgression: text("chord_progression"),
    memo: text("memo"),
    sortOrder: integer("sort_order").notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("sections_song_id_idx").on(table.songId),
    index("sections_song_deleted_sort_idx").on(table.songId, table.deletedAt, table.sortOrder),
  ],
);
