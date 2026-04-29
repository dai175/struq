import { useEffect, useState } from "react";
import { clientLogger } from "@/lib/client-logger";
import {
  type CachedSetlist,
  type CachedSong,
  getAllCachedSetlists,
  getAllCachedSongs,
  OFFLINE_CACHE_CHANGED_EVENT,
} from "./db";

// Subscribes the caller to one store and re-reads on every offline-cache
// change event. Used by both list-row hooks so PC layouts — where the list
// aside stays mounted while the detail loader writes — stay in sync without
// a manual refresh.
function useCachedStore<T>(load: () => Promise<ReadonlyMap<string, T>>): ReadonlyMap<string, T> {
  const [map, setMap] = useState<ReadonlyMap<string, T>>(() => new Map());
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await load();
        if (!cancelled) setMap(next);
      } catch (error) {
        clientLogger.error("useCachedStore", error);
        if (!cancelled) setMap(new Map());
      }
    };
    void refresh();
    window.addEventListener(OFFLINE_CACHE_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(OFFLINE_CACHE_CHANGED_EVENT, refresh);
    };
  }, [load]);
  return map;
}

export function useCachedSongs(): ReadonlyMap<string, CachedSong> {
  return useCachedStore(getAllCachedSongs);
}

export function useCachedSetlists(): ReadonlyMap<string, CachedSetlist> {
  return useCachedStore(getAllCachedSetlists);
}
