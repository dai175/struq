import { useEffect, useRef, useState } from "react";
import { msPerBeat } from "@/songs/perform-utils";

interface CountInOverlayProps {
  /** BPM to space the count ticks at. */
  bpm: number;
  /** Called after the 1 is shown for one full beat — start the section. */
  onComplete: () => void;
}

const COUNT_BEATS = 4;

export function CountInOverlay({ bpm, onComplete }: CountInOverlayProps) {
  const [count, setCount] = useState(COUNT_BEATS);

  // Ref so a parent re-render (which rebuilds onComplete) does not reset the
  // setInterval mid-count-in and shift beats.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let remaining = COUNT_BEATS;
    const id = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(id);
        onCompleteRef.current();
      } else {
        setCount(remaining);
      }
    }, msPerBeat(bpm));
    return () => clearInterval(id);
  }, [bpm]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="font-mono text-[12rem] font-bold leading-none lg:text-[16rem]">{count}</p>
    </div>
  );
}
