import type { CachedSetlist, CachedSong } from "./db";

export type CacheState = "none" | "cached" | "stale";

// Pass `serverUpdatedAt = undefined` when the caller can't observe staleness
// (e.g. SetlistSongItem inside a setlist's song list lacks updatedAt —
// staleness still surfaces on /songs where SongRow carries the field).
function deriveCacheState(cachedUpdatedAt: number | undefined, serverUpdatedAt: number | undefined): CacheState {
  if (cachedUpdatedAt === undefined) return "none";
  if (serverUpdatedAt === undefined) return "cached";
  return cachedUpdatedAt === serverUpdatedAt ? "cached" : "stale";
}

export function songCacheState(
  song: { id: string; updatedAt: number },
  cached: ReadonlyMap<string, CachedSong>,
): CacheState {
  return deriveCacheState(cached.get(song.id)?.song.updatedAt, song.updatedAt);
}

export function setlistCacheState(
  setlist: { id: string; updatedAt: number },
  cached: ReadonlyMap<string, CachedSetlist>,
): CacheState {
  return deriveCacheState(cached.get(setlist.id)?.setlist.updatedAt, setlist.updatedAt);
}

export function songCacheStateById(songId: string, cached: ReadonlyMap<string, CachedSong>): CacheState {
  return deriveCacheState(cached.get(songId)?.song.updatedAt, undefined);
}

export function CacheDot({ state }: { state: CacheState }) {
  if (state === "none") return null;
  const stale = state === "stale";
  const label = stale ? "Offline copy may be out of date" : "Available offline";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block size-1.5 shrink-0 rounded-full"
      style={{ background: stale ? "#eab308" : "var(--color-accent)" }}
    />
  );
}
