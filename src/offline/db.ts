// IndexedDB layer for offline-first read of songs and setlists. All public
// functions short-circuit on the server, so callers (route loaders) can use
// them unconditionally.

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { SetlistRow, SetlistSongItem } from "@/setlists/server-fns";
import type { SectionRow, SongRow } from "@/songs/server-fns";

const DB_NAME = "struq-offline";
const DB_VERSION = 1;
const SCHEMA_VERSION = 1;
const META_KEY = "current";

export const OFFLINE_CACHE_CHANGED_EVENT = "struq:offline-cache-changed";

// Coalesces bursts of mutations (e.g. bulk download fires N puts in a tight
// loop) into a single notification so subscribed list views re-read the
// store once per microtask, not once per write.
let cacheChangedPending = false;
function emitCacheChanged(): void {
  if (!isClient() || cacheChangedPending) return;
  cacheChangedPending = true;
  queueMicrotask(() => {
    cacheChangedPending = false;
    window.dispatchEvent(new Event(OFFLINE_CACHE_CHANGED_EVENT));
  });
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
  // without reshape; full SectionRow data lives in the songs store.
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
      upgrade(db) {
        for (const name of ["songs", "setlists", "meta"] as const) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      },
      blocking() {
        // Release so another tab can upgrade the schema without prompting.
        void dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

// Records written by an older SCHEMA_VERSION can have a stale shape; treat
// them as cache misses so loaders fall through to the server (or fail loudly
// offline) instead of feeding mismatched data into route components.
function isFresh<T extends { schemaVersion: number }>(value: T | undefined): value is T {
  return value !== undefined && value.schemaVersion === SCHEMA_VERSION;
}

export async function getOfflineSong(id: string): Promise<CachedSong | undefined> {
  if (!isClient()) return undefined;
  const db = await getDB();
  const record = await db.get("songs", id);
  return isFresh(record) ? record : undefined;
}

export async function putOfflineSong(song: SongRow, sections: SectionRow[]): Promise<void> {
  if (!isClient()) return;
  const db = await getDB();
  // Skip writes that wouldn't change anything — avoids waking up every
  // mounted list view with a cache-changed event when revalidate (or a
  // re-mount) finds the cached entry already fresh.
  const existing = await db.get("songs", song.id);
  if (existing && existing.song.updatedAt === song.updatedAt) return;
  await db.put("songs", { song, sections, cachedAt: Date.now(), schemaVersion: SCHEMA_VERSION }, song.id);
  emitCacheChanged();
}

export async function getOfflineSetlist(id: string): Promise<CachedSetlist | undefined> {
  if (!isClient()) return undefined;
  const db = await getDB();
  const record = await db.get("setlists", id);
  return isFresh(record) ? record : undefined;
}

export async function putOfflineSetlist(setlist: SetlistRow, songs: SetlistSongItem[]): Promise<void> {
  if (!isClient()) return;
  const db = await getDB();
  const existing = await db.get("setlists", setlist.id);
  if (existing && existing.setlist.updatedAt === setlist.updatedAt) return;
  await db.put("setlists", { setlist, songs, cachedAt: Date.now(), schemaVersion: SCHEMA_VERSION }, setlist.id);
  emitCacheChanged();
}

async function getAllAsMap<K extends "songs" | "setlists">(
  storeName: K,
  keyOf: (value: StruqOfflineDB[K]["value"]) => string,
): Promise<Map<string, StruqOfflineDB[K]["value"]>> {
  if (!isClient()) return new Map();
  const db = await getDB();
  const values = await db.getAll(storeName);
  const map = new Map<string, StruqOfflineDB[K]["value"]>();
  for (const value of values) {
    if (isFresh(value)) map.set(keyOf(value), value);
  }
  return map;
}

export function getAllCachedSongs(): Promise<Map<string, CachedSong>> {
  return getAllAsMap("songs", (v) => v.song.id);
}

export function getAllCachedSetlists(): Promise<Map<string, CachedSetlist>> {
  return getAllAsMap("setlists", (v) => v.setlist.id);
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
// user so logout can verify the same identity owned the data.
export async function ensureUserMatches(userId: string): Promise<void> {
  if (!isClient()) return;
  const meta = await getOfflineMeta();
  if (meta && meta.userId !== userId) {
    await clearAll();
  }
  const db = await getDB();
  await db.put("meta", { userId, lastFlushedAt: Date.now() }, META_KEY);
}
