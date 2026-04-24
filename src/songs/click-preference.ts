import { usePersistedState } from "@/lib/use-persisted-state";

const STORAGE_KEY = "struq.clickEnabled";
const validateBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

export function useClickPreference(): [boolean, (value: boolean) => void] {
  return usePersistedState(STORAGE_KEY, true, validateBool);
}
