import { useEffect, useRef, useState } from "react";
import { msPerBeat } from "@/songs/perform-utils";
import { MetaTag } from "@/ui/meta-tag";

const BEATS_PER_BAR = 4;

interface PreRollOverlayProps {
  /** BPM to space the bar ticks at. */
  bpm: number;
  /** Number of silent bars to show before completing. */
  bars: number;
  /** Called after the final bar elapses — start the next phase. */
  onComplete: () => void;
}

export function PreRollOverlay({ bpm, bars, onComplete }: PreRollOverlayProps) {
  const [remaining, setRemaining] = useState(bars);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let left = bars;
    const id = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(id);
        onCompleteRef.current();
      } else {
        setRemaining(left);
      }
    }, msPerBeat(bpm) * BEATS_PER_BAR);
    return () => clearInterval(id);
  }, [bpm, bars]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center" style={{ background: "var(--color-ink)" }}>
      <MetaTag color="var(--color-dim)" size={11}>
        STAND BY · {bpm} BPM
      </MetaTag>
      <p
        className="mt-6 leading-none"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(120px, 28vmin, 260px)",
          fontWeight: 700,
          color: "var(--color-dim)",
          letterSpacing: "-0.02em",
        }}
      >
        {remaining}
      </p>
      <MetaTag color="var(--color-dim-2)" size={10} style={{ marginTop: 24 }}>
        {remaining === 1 ? "BAR" : "BARS"} REMAINING
      </MetaTag>
    </div>
  );
}
