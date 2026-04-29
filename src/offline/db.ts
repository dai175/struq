// IndexedDB layer for offline-first read of songs and setlists.
//
// Storage shape (denormalized — see docs/offline-plan.md):
//   songs    → keyed by songId,    value = { song, sections, cachedAt, ... }
//   setlists → keyed by setlistId, value = { setlist, songIds, cachedAt, ... }
//   meta     → key 'current',      value = { userId, lastFlushedAt }
//
// All public functions are SSR-safe — they short-circuit when called from a
// non-browser context, so callers (route loaders) can use them unconditionally.

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { SetlistRow, SetlistSongItem } from "@/setlists/server-fns";
import type { SectionRow, SongRow } from "@/songs/server-fns";

const DB_NAME = "struq-offline";
const DB_VERSION = 1;
const SCHEMA_VERSION = 1;
const META_KEY = "current";

// Broadcast a window event after every cache mutation so hooks subscribed via
// useCachedSongs / useCachedSetlists can refresh their snapshot. Bus is a bare
// `Event` rather than `CustomEvent` because consumers re-read the whole store
// — they don't need detail payloads.
export const OFFLINE_CACHE_CHANGED_EVENT = "struq:offline-cache-changed";

function emitCacheChanged(): void {
  if (!isClient()) return;
  window.dispatchEvent(new Event(OFFLINE_CACHE_CHANGED_EVENT));
}

export interface CachedSong {
  song: SongRow;
  sections: SectionRow[];
  cachedAt: number;
  schemaVersion: number;
}

export interface CachedSetlist {
  setlist: SetlistRow;
  // Mirrors getSetlist's response shape so the perform loader can serve it
  // straight from cache without reshaping. The lightweight section data here
  // (id/type/bars/sortOrder) is enough for setlist navigation and the
  // structure-bar visual; full SectionRow data lives in the songs store.
  songs: SetlistSongItem[];
  cachedAt: number;
  schemaVersion: number;
}

export interface OfflineMeta {
  userId: string;
  lastFlushedAt: number;
}

interface StruqOfflineDB extends DBSchema {
  songs: { key: string; value: CachedSong };
  setlists: { key: string; value: CachedSetlist };
  meta: { key: string; value: OfflineMeta };
}

let dbPromise: Promise<IDBPDatabase<StruqOfflineDB>> | null = null;

function isClient(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function getDB(): Promise<IDBPDatabase<StruqOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StruqOfflineDB>(DB_NAME, DB_VERSION, {
      // Schema bumps wipe state; A 案 is read-only so we lose nothing the
      // server can't re-supply on the next visit.
      upgrade(db) {
        for (const name of ["songs", "setlists", "meta"] as const) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      },
      blocked() {
        // Another tab holds an older version open — let it close on its own.
      },
      blocking() {
        // We're holding open while another tab wants to upgrade — release.
        void dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

export async function getOfflineSong(id: string): Promise<CachedSong | undefined> {
  if (!isClient()) return undefined;
  const db = await getDB();
  return db.get("songs", id);
}

export async function putOfflineSong(song: SongRow, sections: SectionRow[]): Promise<void> {
  if (!isClient()) return;
  const db = await getDB();
  await db.put("songs", { song, sections, cachedAt: Date.now(), schemaVersion: SCHEMA_VERSION }, song.id);
  emitCacheChanged();
}

export async function getOfflineSetlist(id: string): Promise<CachedSetlist | undefined> {
  if (!isClient()) return undefined;
  const db = await getDB();
  return db.get("setlists", id);
}

export async function putOfflineSetlist(setlist: SetlistRow, songs: SetlistSongItem[]): Promise<void> {
  if (!isClient()) return;
  const db = await getDB();
  await db.put("setlists", { setlist, songs, cachedAt: Date.now(), schemaVersion: SCHEMA_VERSION }, setlist.id);
  emitCacheChanged();
}

export async function listCachedSongIds(): Promise<Set<string>> {
  if (!isClient()) return new Set();
  const db = await getDB();
  const keys = await db.getAllKeys("songs");
  return new Set(keys);
}

export async function listCachedSetlistIds(): Promise<Set<string>> {
  if (!isClient()) return new Set();
  const db = await getDB();
  const keys = await db.getAllKeys("setlists");
  return new Set(keys);
}

// Returns every cached entry indexed by id. List-row UI uses this to compare
// each row's `updatedAt` against the cached copy and render the appropriate
// dot state (cached / stale).
export async function getAllCachedSongs(): Promise<Map<string, CachedSong>> {
  if (!isClient()) return new Map();
  const db = await getDB();
  const [keys, values] = await Promise.all([db.getAllKeys("songs"), db.getAll("songs")]);
  const map = new Map<string, CachedSong>();
  for (let i = 0; i < keys.length; i++) {
    map.set(keys[i], values[i]);
  }
  return map;
}

export async function getAllCachedSetlists(): Promise<Map<string, CachedSetlist>> {
  if (!isClient()) return new Map();
  const db = await getDB();
  const [keys, values] = await Promise.all([db.getAllKeys("setlists"), db.getAll("setlists")]);
  const map = new Map<string, CachedSetlist>();
  for (let i = 0; i < keys.length; i++) {
    map.set(keys[i], values[i]);
  }
  return map;
}

export async function getOfflineMeta(): Promise<OfflineMeta | undefined> {
  if (!isClient()) return undefined;
  const db = await getDB();
  return db.get("meta", META_KEY);
}

export async function clearAll(): Promise<void> {
  if (!isClient()) return;
  const db = await getDB();
  const tx = db.transaction(["songs", "setlists", "meta"], "readwrite");
  await Promise.all([
    tx.objectStore("songs").clear(),
    tx.objectStore("setlists").clear(),
    tx.objectStore("meta").clear(),
  ]);
  await tx.done;
  emitCacheChanged();
}

// Wipes the cache when the active user changes; otherwise stamps the current
// user so logout (Step 7) can verify the same identity owned the data.
export async function ensureUserMatches(userId: string): Promise<void> {
  if (!isClient()) return;
  const meta = await getOfflineMeta();
  if (meta && meta.userId !== userId) {
    await clearAll();
  }
  const db = await getDB();
  await db.put("meta", { userId, lastFlushedAt: Date.now() }, META_KEY);
}
