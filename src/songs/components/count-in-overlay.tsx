import { useEffect, useRef, useState } from "react";
import { msPerBeat } from "@/songs/perform-utils";
import { MetaTag } from "@/ui/meta-tag";

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
    <div className="flex flex-1 flex-col items-center justify-center" style={{ background: "var(--color-ink)" }}>
      <MetaTag color="var(--color-accent)" size={11}>
        COUNT-IN · {bpm} BPM
      </MetaTag>
      <p
        className="mt-6 leading-none"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(120px, 28vmin, 260px)",
          fontWeight: 700,
          color: "var(--color-accent)",
          letterSpacing: "-0.02em",
          textShadow: "0 0 40px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        }}
      >
        {count}
      </p>
    </div>
  );
}
