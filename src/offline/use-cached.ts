import { useEffect, useState } from "react";
import {
  type CachedSetlist,
  type CachedSong,
  getAllCachedSetlists,
  getAllCachedSongs,
  OFFLINE_CACHE_CHANGED_EVENT,
} from "./db";

const EMPTY_SONGS: ReadonlyMap<string, CachedSong> = new Map();
const EMPTY_SETLISTS: ReadonlyMap<string, CachedSetlist> = new Map();

// Subscribes the caller to a single store and re-reads whenever the offline
// db emits its change event (i.e. any putOffline / clearAll). Used by both
// the songs and setlists hooks so PC layouts — where the list aside stays
// mounted while the detail loader writes — stay in sync without a manual
// refresh.
function useCachedStore<T>(load: () => Promise<ReadonlyMap<string, T>>, empty: ReadonlyMap<string, T>) {
  const [map, setMap] = useState<ReadonlyMap<string, T>>(empty);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void load().then((m) => {
        if (!cancelled) setMap(m);
      });
    };
    refresh();
    window.addEventListener(OFFLINE_CACHE_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(OFFLINE_CACHE_CHANGED_EVENT, refresh);
    };
  }, [load]);
  return map;
}

export function useCachedSongs(): ReadonlyMap<string, CachedSong> {
  return useCachedStore(getAllCachedSongs, EMPTY_SONGS);
}

export function useCachedSetlists(): ReadonlyMap<string, CachedSetlist> {
  return useCachedStore(getAllCachedSetlists, EMPTY_SETLISTS);
}
