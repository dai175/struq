import { useEffect, useState } from "react";

// Generic localStorage-backed state. Starts with `defaultValue` to match the
// SSR render, then hydrates from storage inside useEffect. `validate` guards
// against corrupt, stale, or schema-mismatched values — return `null` to
// reject and keep the default.
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  validate: (raw: unknown) => T | null,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return;
    try {
      const validated = validate(JSON.parse(raw));
      if (validated !== null) setValue(validated);
    } catch {}
  }, [key, validate]);

  function update(next: T) {
    setValue(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(next));
    }
  }

  return [value, update];
}
