interface VolumeSliderProps {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  /** Handle pixel height. Track is always 4px. Default 12. */
  handleHeight?: number;
}

/**
 * Broadcast-console volume slider — a transparent <input type="range"> sits on
 * top of a custom 4px track + accent fill + white handle, so keyboard /
 * screen-reader users get native semantics while the visual matches the
 * design handoff. The wrapper is 24px tall (WCAG 2.5.8 minimum target size)
 * and surfaces keyboard focus via `.volume-slider:focus-within` in styles.css.
 */
export function VolumeSlider({ value, onChange, ariaLabel, handleHeight = 12 }: VolumeSliderProps) {
  return (
    <div className="volume-slider" style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value}%`,
            background: "var(--color-accent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${value}%`,
            top: -((handleHeight - 4) / 2),
            width: 2,
            height: handleHeight,
            background: "#fff",
            transform: "translateX(-1px)",
            pointerEvents: "none",
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
}
