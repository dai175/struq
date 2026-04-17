import type { SectionRow } from "./server-fns";

// ─── Constants ─────────────────────────────────────────
//
// Struq assumes 4/4 time throughout the app (no time-signature column in the
// schema). Beats per bar is hard-coded here so the assumption is named once.
export const BEATS_PER_BAR = 4;

// ─── Section duration ──────────────────────────────────

// Throws on invalid BPM: callers must ensure BPM is valid (auto mode is disabled
// in the UI when BPM is missing), so reaching this path is a programmer error.
export function calculateSectionDurationMs(section: SectionRow, bpm: number): number {
  if (bpm <= 0) throw new Error(`Invalid BPM: ${bpm}`);
  const totalBeats = section.bars * BEATS_PER_BAR + section.extraBeats;
  const msPerBeat = 60_000 / bpm;
  return Math.round(totalBeats * msPerBeat);
}
