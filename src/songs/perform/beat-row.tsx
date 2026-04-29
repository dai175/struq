import { msPerBeat } from "@/songs/perform-utils";

export function BeatRow({ currentBeat, bpm, color }: { currentBeat: number; bpm: number | null; color: string }) {
  const beats = 4;
  const beatInBar = bpm && currentBeat >= 0 ? currentBeat % beats : -1;
  return (
    <div className="flex gap-2" style={{ color }}>
      {Array.from({ length: beats }, (_, i) => {
        const active = i === beatInBar;
        const past = i < beatInBar;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, never reordered
            key={i}
            style={{
              width: 38,
              height: 38,
              background: active ? "currentColor" : "transparent",
              border: "1px solid currentColor",
              opacity: active ? 1 : past ? 0.45 : 0.2,
              boxShadow: active ? "var(--glow-beat)" : undefined,
              animation: active && bpm ? `beat-pop 80ms ease-out` : undefined,
              animationDuration: active && bpm ? `${Math.min(msPerBeat(bpm) * 0.6, 180)}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
