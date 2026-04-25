import { useEffect, useRef, useState } from "react";

/**
 * Counts down from `from` to 0 at fixed `tickMs` intervals, calling `onComplete`
 * at the final tick. The returned value is what to display (it never reaches 0).
 *
 * `onComplete` is captured via ref so a parent re-render does not reset the
 * interval mid-countdown and shift the cadence.
 */
export function useTickdown(from: number, tickMs: number, onComplete: () => void): number {
  const [remaining, setRemaining] = useState(from);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(from);
    let left = from;
    const id = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(id);
        onCompleteRef.current();
      } else {
        setRemaining(left);
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [from, tickMs]);

  return remaining;
}
