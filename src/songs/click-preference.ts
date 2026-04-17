import { useEffect, useState } from "react";

const STORAGE_KEY = "struq.clickEnabled";
const DEFAULT = true;

function read(): boolean {
  if (typeof window === "undefined") return DEFAULT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return DEFAULT;
  return raw === "true";
}

function write(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

export function useClickPreference(): [boolean, (value: boolean) => void] {
  // Start with the default to match the server render, then hydrate from storage.
  const [enabled, setEnabled] = useState<boolean>(DEFAULT);

  useEffect(() => {
    setEnabled(read());
  }, []);

  function update(value: boolean) {
    setEnabled(value);
    write(value);
  }

  return [enabled, update];
}
