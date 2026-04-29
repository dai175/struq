import { isOffline } from "@/offline/use-online-status";
import { getAuthUser } from "./server-fns";
import type { SessionUser } from "./session";

// localStorage mirror of the SessionUser. Used as a last-known-good fallback
// when the network is unreachable so route loaders can keep rendering instead
// of throwing — the cached value is replaced on every successful auth check
// and cleared when the server reports no session.
const STORAGE_KEY = "struq.session.user";

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readCachedUser(): SessionUser | null {
  if (!isClient()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function writeCachedUser(user: SessionUser | null): void {
  if (!isClient()) return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearCachedUser(): void {
  writeCachedUser(null);
}

// Offline-tolerant wrapper around getAuthUser. Online: refreshes the cache
// with the live session. Offline: returns the last cached SessionUser so
// route loaders can keep working with previously-fetched IDB data. Any other
// error (e.g. server 500) propagates so we don't mask real failures.
export async function getAuthUserWithCache(): Promise<SessionUser | null> {
  try {
    const user = await getAuthUser();
    writeCachedUser(user);
    return user;
  } catch (error) {
    if (isOffline()) {
      return readCachedUser();
    }
    throw error;
  }
}
