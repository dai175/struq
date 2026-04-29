export type PerformMode = "selecting" | "manual" | "preroll" | "countin" | "auto" | "paused";

export function isRunningMode(mode: PerformMode): boolean {
  return mode === "auto" || mode === "countin" || mode === "preroll";
}

export const SAFE_AREA_STYLE = {
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
} as const;
