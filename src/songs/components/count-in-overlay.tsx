import { msPerBeat } from "@/songs/perform-utils";
import { useTickdown } from "@/songs/use-tickdown";
import { MetaTag } from "@/ui/meta-tag";

const COUNT_BEATS = 4;

interface CountInOverlayProps {
  /** BPM to space the count ticks at. */
  bpm: number;
  /** Called after the 1 is shown for one full beat — start the section. */
  onComplete: () => void;
}

export function CountInOverlay({ bpm, onComplete }: CountInOverlayProps) {
  const count = useTickdown(COUNT_BEATS, msPerBeat(bpm), onComplete);

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
