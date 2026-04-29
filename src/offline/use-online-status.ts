import { useSyncExternalStore } from "react";

// Shared online-status store. Single module-level state so every consumer
// reads the same snapshot — earlier per-instance `useState` versions had a
// bug where setOnline(true) calls weren't flipping the rendered value
// despite probes succeeding. useSyncExternalStore is the React 18-correct
// way to subscribe to an external mutable source and avoids that class of
// bug entirely.

let online = typeof navigator === "undefined" ? true : navigator.onLine;
const listeners = new Set<() => void>();
let monitoring = false;

function notify(): void {
  for (const listener of listeners) listener();
}

function setOnline(value: boolean): void {
  if (online === value) return;
  online = value;
  notify();
}

async function probe(): Promise<boolean> {
  try {
    await fetch(`/favicon.ico?_probe=${Date.now()}`, { method: "HEAD", cache: "no-store" });
    return true;
  } catch {
    return false;
  }
}

// Wait for the SW to activate (with a 1s cap so registration failures don't
// block forever), then probe up to three times with backoff. The retry
// covers the brief window right after a reload where Workbox can return
// "no-response" while the SW is still activating.
async function verify(): Promise<void> {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    await Promise.race([navigator.serviceWorker.ready.catch(() => undefined), new Promise((r) => setTimeout(r, 1000))]);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await probe()) {
      setOnline(true);
      return;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  setOnline(false);
}

function startMonitoring(): void {
  if (monitoring || typeof window === "undefined") return;
  monitoring = true;
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => void verify());
  void verify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  startMonitoring();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return online;
}

function getServerSnapshot(): boolean {
  return true;
}

// Imperative version for non-React callers (route loaders). SSR returns false
// so loaders never take the offline branch on the server.
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
