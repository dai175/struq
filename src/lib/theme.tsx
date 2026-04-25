import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { usePersistedState } from "./use-persisted-state";

export const APPEARANCE_STORAGE_KEY = "struq.settings.appearance";

export type Appearance = "DARK" | "AUTO" | "LIGHT";
export type ResolvedTheme = "dark" | "light";

const APPEARANCES = ["DARK", "AUTO", "LIGHT"] as const;

const validateAppearance = (v: unknown): Appearance | null =>
  typeof v === "string" && (APPEARANCES as readonly string[]).includes(v) ? (v as Appearance) : null;

export function resolveAppearance(appearance: Appearance, prefersLight: boolean): ResolvedTheme {
  if (appearance === "DARK") return "dark";
  if (appearance === "LIGHT") return "light";
  return prefersLight ? "light" : "dark";
}

// Inlined into <head> to land `data-theme` before first paint. Safari throws
// on localStorage in private mode, so the try/catch falls back to dark.
export const THEME_PRE_PAINT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});
    var v = raw ? JSON.parse(raw) : "DARK";
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    if (v === "LIGHT" || (v === "AUTO" && prefersLight)) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
})();
`.trim();

interface ThemeContextValue {
  appearance: Appearance;
  setAppearance: (next: Appearance) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * App-level theme owner. Mounted once at the root so AUTO mode tracks
 * `prefers-color-scheme` across all screens, and so the appearance toggle
 * has a single source of truth shared with non-settings screens.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = usePersistedState<Appearance>(APPEARANCE_STORAGE_KEY, "DARK", validateAppearance);
  useThemeSync(appearance);
  return <ThemeContext.Provider value={{ appearance, setAppearance }}>{children}</ThemeContext.Provider>;
}

export function useAppearance(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppearance must be used inside ThemeProvider");
  return ctx;
}

// Skip the very first effect run: `usePersistedState` returns the default
// ("DARK") on initial render and only loads the saved value in a follow-up
// effect, so applying immediately would clobber the pre-paint script's
// correct attribute. The next effect run (after localStorage hydrates) takes
// over normally.
function useThemeSync(appearance: Appearance): void {
  const skipFirst = useRef(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const html = document.documentElement;
      if (resolveAppearance(appearance, media.matches) === "light") html.setAttribute("data-theme", "light");
      else html.removeAttribute("data-theme");
    };
    if (skipFirst.current) skipFirst.current = false;
    else apply();
    if (appearance !== "AUTO") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance]);
}
