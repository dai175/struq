import { CLICK_SOUNDS, type ClickSound } from "@/lib/click-voices";
import { usePersistedState } from "@/lib/use-persisted-state";

export type { ClickSound };
export { CLICK_SOUNDS };

export const PRE_ROLL_OPTIONS = [0, 1, 2, 4] as const;
export type PreRollBars = (typeof PRE_ROLL_OPTIONS)[number];

// ENABLED_KEY predates the "struq.settings." namespace used by the other
// preferences; renaming would silently reset existing users' click on/off
// choice, so the legacy key is kept until a deliberate migration.
const ENABLED_KEY = "struq.clickEnabled";
const VOLUME_KEY = "struq.settings.clickVolume";
const SOUND_KEY = "struq.settings.clickSound";
const COUNT_IN_KEY = "struq.settings.countIn";
const PRE_ROLL_KEY = "struq.settings.preRollBars";
const ACCENT_KEY = "struq.settings.accentDownbeat";

const DEFAULT_ENABLED = true;
const DEFAULT_VOLUME = 62;
const DEFAULT_SOUND: ClickSound = "TICK";
const DEFAULT_COUNT_IN = true;
const DEFAULT_PRE_ROLL: PreRollBars = 0;
const DEFAULT_ACCENT = true;

const validateBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const validateVolume = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
const validateSound = (v: unknown): ClickSound | null =>
  typeof v === "string" && (CLICK_SOUNDS as readonly string[]).includes(v) ? (v as ClickSound) : null;
const validatePreRoll = (v: unknown): PreRollBars | null =>
  typeof v === "number" && (PRE_ROLL_OPTIONS as readonly number[]).includes(v) ? (v as PreRollBars) : null;

export function useClickPreference(): [boolean, (value: boolean) => void] {
  return usePersistedState(ENABLED_KEY, DEFAULT_ENABLED, validateBool);
}

export function useClickVolume(): [number, (value: number) => void] {
  return usePersistedState(VOLUME_KEY, DEFAULT_VOLUME, validateVolume);
}

export function useClickSound(): [ClickSound, (value: ClickSound) => void] {
  return usePersistedState(SOUND_KEY, DEFAULT_SOUND, validateSound);
}

export function useCountIn(): [boolean, (value: boolean) => void] {
  return usePersistedState(COUNT_IN_KEY, DEFAULT_COUNT_IN, validateBool);
}

export function usePreRollBars(): [PreRollBars, (value: PreRollBars) => void] {
  return usePersistedState(PRE_ROLL_KEY, DEFAULT_PRE_ROLL, validatePreRoll);
}

export function useAccentDownbeat(): [boolean, (value: boolean) => void] {
  return usePersistedState(ACCENT_KEY, DEFAULT_ACCENT, validateBool);
}
