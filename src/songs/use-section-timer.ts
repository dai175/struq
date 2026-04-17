import { useEffect, useRef } from "react";

// Pause/resume-able countdown. Uses performance.now() (monotonic) so the
// remainder survives wall-clock jumps (NTP sync, device sleep).

export interface UseSectionTimerOptions {
  /** Total ms the current section should run. Use `calculateSectionDurationMs`. */
  durationMs: number;
  /** Called once when the remainder hits zero. */
  onComplete: () => void;
  /** True = counting down; false = paused (preserves remaining). */
  isRunning: boolean;
  /** Resets the remainder to `durationMs` when this changes (e.g. sectionId). */
  resetKey: string | number;
}

export function useSectionTimer({ durationMs, onComplete, isRunning, resetKey }: UseSectionTimerOptions): void {
  // Handle to the currently-scheduled setTimeout (null when not running).
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // performance.now() at the moment the timer (re)started running.
  const startedAtRef = useRef<number | null>(null);
  // How much time is left to count from; decremented on each pause.
  const remainingMsRef = useRef<number>(durationMs);
  // Keep the latest onComplete so the scheduled setTimeout calls a fresh ref.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track the last-seen resetKey so we can detect section changes inside a
  // single merged effect. Keeping reset + pause/resume in one effect avoids
  // ordering hazards when multiple effects fire on the same render.
  const prevResetKeyRef = useRef(resetKey);

  useEffect(() => {
    // Section changed → clear remaining and prior-run markers before deciding
    // what to do for the current isRunning state.
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      remainingMsRef.current = durationMs;
      startedAtRef.current = null;
    }

    // The cleanup below runs before the next body on re-run, so it clears
    // timeoutRef. The pause branch therefore guards on startedAtRef (which
    // cleanup doesn't touch) to detect that a run was in progress.
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
  }, [isRunning, resetKey, durationMs]);
}
