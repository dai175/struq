import type { SectionRow } from "./server-fns";

// Struq assumes 4/4 time throughout the app (no time-signature column in the
// schema). Beats per bar is hard-coded here so the assumption is named once.
export const BEATS_PER_BAR = 4;

export function msPerBeat(bpm: number): number {
  return 60_000 / bpm;
}

export function sectionBeats(section: SectionRow): number {
  return section.bars * BEATS_PER_BAR + section.extraBeats;
}

export function calculateSectionDurationMs(section: SectionRow, bpm: number): number {
  return Math.round(sectionBeats(section) * msPerBeat(bpm));
}
