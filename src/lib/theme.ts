import { useEffect } from "react";

/**
 * Theme application. Resolves the user's stored `Appearance` setting
 * (`DARK | AUTO | LIGHT`) into a concrete `dark | light` and writes it to
 * `<html data-theme>`. AUTO follows the OS `prefers-color-scheme` and updates
 * live when the OS preference changes.
 *
 * Two surfaces:
 *  - `THEME_PRE_PAINT_SCRIPT` — inlined into the document `<head>` so the
 *    correct attribute lands before first paint (no FOUC).
 *  - `useThemeSync()` — keeps `<html data-theme>` in sync with the React state
 *    after the user toggles the setting, and tracks `matchMedia` for AUTO.
 */

export const APPEARANCE_STORAGE_KEY = "struq.settings.appearance";

export type Appearance = "DARK" | "AUTO" | "LIGHT";
export type ResolvedTheme = "dark" | "light";

export function resolveAppearance(appearance: Appearance, prefersLight: boolean): ResolvedTheme {
  if (appearance === "DARK") return "dark";
  if (appearance === "LIGHT") return "light";
  return prefersLight ? "light" : "dark";
}

/**
 * Inline script content for `<head>`. Self-contained, no closures over the
 * module — must be a string serialized into the HTML before hydration.
 * Wrapped in try/catch because Safari throws on `localStorage` access in
 * private mode; on failure we silently fall back to the dark default.
 */
export const THEME_PRE_PAINT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});
    var v = raw ? JSON.parse(raw) : "DARK";
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var resolved = v === "LIGHT" ? "light" : v === "AUTO" ? (prefersLight ? "light" : "dark") : "dark";
    if (resolved === "light") document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
})();
`.trim();

/**
 * Keep `<html data-theme>` in sync with `appearance`. For AUTO, also subscribes
 * to `prefers-color-scheme` so the theme follows live OS changes.
 */
export function useThemeSync(appearance: Appearance): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const resolved = resolveAppearance(appearance, media.matches);
      const html = document.documentElement;
      if (resolved === "light") html.setAttribute("data-theme", "light");
      else html.removeAttribute("data-theme");
    };
    apply();
    if (appearance !== "AUTO") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance]);
}
