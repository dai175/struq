import { useCallback, useEffect, useState } from "react";
import { clientLogger } from "@/lib/client-logger";

/**
 * Generic localStorage-backed state. Starts with `defaultValue` to match the
 * SSR render, then hydrates from storage inside useEffect. `validate` guards
 * against corrupt, stale, or schema-mismatched values — return `null` to
 * reject and keep the default.
 *
 * `validate` must be a stable reference (module-scope or `useCallback`-wrapped);
 * recreating it every render re-runs the hydration effect.
 */
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
    } catch (err) {
      clientLogger.warn("usePersistedState", { key, raw, err });
    }
  }, [key, validate]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    },
    [key],
  );

  return [value, update];
}
