import type { CSSProperties } from "react";

interface VolumeSliderProps {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  /** Handle pixel height. Track is always 4px. Default 12. */
  handleHeight?: number;
  disabled?: boolean;
}

const WRAPPER_STYLE: CSSProperties = {
  position: "relative",
  height: 24,
  display: "flex",
  alignItems: "center",
};

const TRACK_STYLE: CSSProperties = {
  width: "100%",
  height: 4,
  background: "var(--color-line-2)",
  position: "relative",
};

const FILL_STYLE: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  background: "var(--color-accent)",
};

const HANDLE_STYLE: CSSProperties = {
  position: "absolute",
  width: 2,
  background: "var(--color-text-strong)",
  transform: "translateX(-1px)",
  pointerEvents: "none",
};

const INPUT_BASE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  margin: 0,
  padding: 0,
};

/**
 * Broadcast-console volume slider — a transparent <input type="range"> sits on
 * top of a custom 4px track + accent fill + white handle, so keyboard /
 * screen-reader users get native semantics while the visual matches the
 * design handoff. The wrapper is 24px tall (WCAG 2.5.8 minimum target size)
 * and surfaces keyboard focus via `.volume-slider:focus-within` in styles.css.
 */
export function VolumeSlider({ value, onChange, ariaLabel, handleHeight = 12, disabled = false }: VolumeSliderProps) {
  return (
    <div className="volume-slider" style={WRAPPER_STYLE}>
      <div style={TRACK_STYLE}>
        <div style={{ ...FILL_STYLE, width: `${value}%` }} />
        <div
          style={{
            ...HANDLE_STYLE,
            left: `${value}%`,
            top: -((handleHeight - 4) / 2),
            height: handleHeight,
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
        disabled={disabled}
        style={{ ...INPUT_BASE_STYLE, cursor: disabled ? "not-allowed" : "pointer" }}
      />
    </div>
  );
}
