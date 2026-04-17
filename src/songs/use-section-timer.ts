import { useEffect, useRef } from "react";

// Pause/resume-able countdown. Uses performance.now() (monotonic) so the
// remainder survives wall-clock jumps (NTP sync, device sleep).

export interface UseSectionTimerOptions {
  /** Total ms the current section should run. Captured when sectionId changes. */
  durationMs: number;
  /** Called once when the remainder hits zero. */
  onComplete: () => void;
  /** True = counting down; false = paused (preserves remaining). */
  isRunning: boolean;
  /** Resets the remainder when this changes. Changing durationMs alone does NOT restart. */
  sectionId: string | number;
}

export function useSectionTimer({ durationMs, onComplete, isRunning, sectionId }: UseSectionTimerOptions): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const remainingMsRef = useRef<number>(durationMs);

  // Refs so deps stay minimal: updates to onComplete / durationMs alone must
  // not restart the timer. durationMs is applied at the next sectionId change.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const prevSectionIdRef = useRef(sectionId);

  useEffect(() => {
    if (prevSectionIdRef.current !== sectionId) {
      prevSectionIdRef.current = sectionId;
      remainingMsRef.current = durationMsRef.current;
      startedAtRef.current = null;
    }

    // Cleanup below clears timeoutRef on every re-run, so the pause branch
    // guards on startedAtRef (which cleanup doesn't touch) to detect that
    // a run was in progress and the remainder needs updating.
    if (isRunning) {
      startedAtRef.current = performance.now();
      timeoutRef.current = setTimeout(() => onCompleteRef.current(), remainingMsRef.current);
    } else if (startedAtRef.current !== null) {
      const elapsed = performance.now() - startedAtRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      startedAtRef.current = null;
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isRunning, sectionId]);
}
