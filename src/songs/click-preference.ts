import { CLICK_SOUNDS, type ClickSound } from "@/lib/click-voices";
import { usePersistedState } from "@/lib/use-persisted-state";

export type { ClickSound };
export { CLICK_SOUNDS };

const ENABLED_KEY = "struq.clickEnabled";
const VOLUME_KEY = "struq.settings.clickVolume";
const SOUND_KEY = "struq.settings.clickSound";

const DEFAULT_VOLUME = 62;
const DEFAULT_SOUND: ClickSound = "TICK";

const validateBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const validateVolume = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
const validateSound = (v: unknown): ClickSound | null =>
  typeof v === "string" && (CLICK_SOUNDS as readonly string[]).includes(v) ? (v as ClickSound) : null;

export function useClickPreference(): [boolean, (value: boolean) => void] {
  return usePersistedState(ENABLED_KEY, true, validateBool);
}

export function useClickVolume(): [number, (value: number) => void] {
  return usePersistedState(VOLUME_KEY, DEFAULT_VOLUME, validateVolume);
}

export function useClickSound(): [ClickSound, (value: ClickSound) => void] {
  return usePersistedState(SOUND_KEY, DEFAULT_SOUND, validateSound);
}
