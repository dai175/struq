import { useEffect, useState } from "react";

interface CountInOverlayProps {
  /** BPM to space the count ticks at. */
  bpm: number;
  /** Called after the 1 is shown for one full beat — start the section. */
  onComplete: () => void;
}

const COUNT_BEATS = 4;

export function CountInOverlay({ bpm, onComplete }: CountInOverlayProps) {
  // Start at 4 and decrement; 0 means "done, call onComplete and unmount".
  const [count, setCount] = useState(COUNT_BEATS);

  useEffect(() => {
    const interval = 60_000 / bpm;
    const timer = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1);
      } else {
        onComplete();
      }
    }, interval);
    return () => clearTimeout(timer);
  }, [count, bpm, onComplete]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="font-mono text-[12rem] font-bold leading-none lg:text-[16rem]">{count}</p>
    </div>
  );
}
