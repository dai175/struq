import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR, msPerBeat, sectionBeats } from "./perform-utils";
import type { SectionRow } from "./server-fns";

// Tracks the 0-indexed beat within the current bar (0..BEATS_PER_BAR-1).
// Returns -1 before the first beat of the section has fired. Uses
// requestAnimationFrame so the LED flash stays tight even at high BPM.

export interface UseCurrentBeatOptions {
  /** Null when the song has no BPM; hook stays at -1 in that case. */
  bpm: number | null;
  /** Current section. Undefined when the song has ended. */
  section: SectionRow | undefined;
  /** True while counting; false pauses and preserves elapsed. */
  isRunning: boolean;
  /** Reset trigger — any change restarts from beat -1. */
  sectionId: string | number;
}

export function useCurrentBeat({ bpm, section, isRunning, sectionId }: UseCurrentBeatOptions): number {
  const [beatInBar, setBeatInBar] = useState(-1);

  const startedAtRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);
  const prevSectionIdRef = useRef(sectionId);

  useEffect(() => {
    if (prevSectionIdRef.current !== sectionId) {
      prevSectionIdRef.current = sectionId;
      elapsedMsRef.current = 0;
      startedAtRef.current = null;
      setBeatInBar(-1);
    }

    if (!isRunning || !bpm || !section) {
      if (startedAtRef.current !== null) {
        elapsedMsRef.current += performance.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      return;
    }

    const beatMs = msPerBeat(bpm);
    const totalBeats = sectionBeats(section);
    const startedAt = performance.now();
    startedAtRef.current = startedAt;

    let rafId: number | null = null;
    const tick = () => {
      const elapsed = elapsedMsRef.current + (performance.now() - startedAt);
      const absoluteBeat = Math.min(totalBeats - 1, Math.floor(elapsed / beatMs));
      const position = absoluteBeat % BEATS_PER_BAR;
      setBeatInBar((prev) => (prev === position ? prev : position));
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      elapsedMsRef.current += performance.now() - startedAt;
      startedAtRef.current = null;
    };
  }, [isRunning, bpm, section, sectionId]);

  return beatInBar;
}
