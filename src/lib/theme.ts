import { useEffect } from "react";

export const APPEARANCE_STORAGE_KEY = "struq.settings.appearance";

export type Appearance = "DARK" | "AUTO" | "LIGHT";
export type ResolvedTheme = "dark" | "light";

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

export function useThemeSync(appearance: Appearance): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const html = document.documentElement;
      if (resolveAppearance(appearance, media.matches) === "light") html.setAttribute("data-theme", "light");
      else html.removeAttribute("data-theme");
    };
    apply();
    if (appearance !== "AUTO") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance]);
}
