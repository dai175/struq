import type { CachedSetlist, CachedSong } from "./db";

// "cached"  → row's offline copy is in sync with the latest server payload.
// "stale"   → cache exists but server's `updatedAt` no longer matches; the
//             revalidation pass that runs alongside the perform-route load
//             will refresh it on next visit.
// "none"    → no offline copy yet.
export type CacheState = "none" | "cached" | "stale";

export function songCacheState(
  song: { id: string; updatedAt: number },
  cached: ReadonlyMap<string, CachedSong>,
): CacheState {
  const entry = cached.get(song.id);
  if (!entry) return "none";
  return entry.song.updatedAt === song.updatedAt ? "cached" : "stale";
}

export function setlistCacheState(
  setlist: { id: string; updatedAt: number },
  cached: ReadonlyMap<string, CachedSetlist>,
): CacheState {
  const entry = cached.get(setlist.id);
  if (!entry) return "none";
  return entry.setlist.updatedAt === setlist.updatedAt ? "cached" : "stale";
}

interface CacheDotProps {
  state: CacheState;
}

export function CacheDot({ state }: CacheDotProps) {
  if (state === "none") return null;
  const stale = state === "stale";
  return (
    <span
      role="img"
      aria-label={stale ? "Offline copy may be out of date" : "Available offline"}
      title={stale ? "Offline copy may be out of date" : "Available offline"}
      className="inline-block size-1.5 shrink-0 rounded-full"
      style={{ background: stale ? "#eab308" : "var(--color-accent)" }}
    />
  );
}
