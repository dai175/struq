import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ─── Users ──────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  locale: text("locale", { enum: ["ja", "en"] }).notNull().default("ja"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "number" }),
});

// ─── Songs ──────────────────────────────────────────────
export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  artist: text("artist"),
  bpm: integer("bpm"),
  key: text("key"),
  referenceUrl: text("reference_url"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "number" }),
});

// ─── Setlists ───────────────────────────────────────────
export const setlists = sqliteTable("setlists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  sessionDate: text("session_date"),
  venue: text("venue"),
  sortOrder: integer("sort_order").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "number" }),
});

// ─── SetlistSongs (junction) ────────────────────────────
export const setlistSongs = sqliteTable(
  "setlist_songs",
  {
    setlistId: text("setlist_id")
      .notNull()
      .references(() => setlists.id),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [primaryKey({ columns: [table.setlistId, table.songId] })],
);

// ─── Sections ───────────────────────────────────────────
export const sections = sqliteTable("sections", {
  id: text("id").primaryKey(),
  songId: text("song_id")
    .notNull()
    .references(() => songs.id),
  type: text("type").notNull(),
  label: text("label").notNull(),
  bars: integer("bars").notNull().default(8),
  extraBeats: integer("extra_beats").notNull().default(0),
  chordProgression: text("chord_progression"),
  memo: text("memo"),
  sortOrder: integer("sort_order").notNull(),
  deletedAt: integer("deleted_at", { mode: "number" }),
});
