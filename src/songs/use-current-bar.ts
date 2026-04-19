import { useEffect, useRef, useState } from "react";
import { msPerBar } from "./perform-utils";

// Tracks the 1-indexed current bar within a running section, preserving
// progress across pause/resume. Polling (vs per-bar setTimeouts) keeps the
// display robust if BPM changes or the tab is backgrounded.

export interface UseCurrentBarOptions {
  /** Null when the song has no BPM; hook stays at bar 1 in that case. */
  bpm: number | null;
  /** Total full bars in the section. extraBeats are not counted as a dot. */
  totalBars: number;
  /** True while counting; false pauses and preserves elapsed. */
  isRunning: boolean;
  /** Reset trigger — any change restarts from bar 1. */
  sectionId: string | number;
}

const TICK_MS = 100;

export function useCurrentBar({ bpm, totalBars, isRunning, sectionId }: UseCurrentBarOptions): number {
  const [currentBar, setCurrentBar] = useState(1);

  const startedAtRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);
  const prevSectionIdRef = useRef(sectionId);

  useEffect(() => {
    if (prevSectionIdRef.current !== sectionId) {
      prevSectionIdRef.current = sectionId;
      elapsedMsRef.current = 0;
      startedAtRef.current = null;
      setCurrentBar(1);
    }

    if (!isRunning || !bpm || totalBars <= 0) {
      if (startedAtRef.current !== null) {
        elapsedMsRef.current += performance.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      return;
    }

    const barMs = msPerBar(bpm);
    const startedAt = performance.now();
    startedAtRef.current = startedAt;

    const tick = () => {
      const elapsed = elapsedMsRef.current + (performance.now() - startedAt);
      const bar = Math.min(totalBars, Math.floor(elapsed / barMs) + 1);
      setCurrentBar((prev) => (prev === bar ? prev : bar));
    };

    tick();
    const interval = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, bpm, totalBars, sectionId]);

  return currentBar;
}
