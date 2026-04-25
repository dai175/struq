import { usePersistedState } from "@/lib/use-persisted-state";

const ENABLED_KEY = "struq.clickEnabled";
const VOLUME_KEY = "struq.settings.clickVolume";

const DEFAULT_VOLUME = 62;

const validateBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const validateVolume = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;

export function useClickPreference(): [boolean, (value: boolean) => void] {
  return usePersistedState(ENABLED_KEY, true, validateBool);
}

export function useClickVolume(): [number, (value: number) => void] {
  return usePersistedState(VOLUME_KEY, DEFAULT_VOLUME, validateVolume);
}
