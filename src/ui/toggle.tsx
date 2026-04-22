interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Toggle — 54x28 track, 24x24 thumb. On = accent background + black thumb right.
 * Off = 10% white track + 35% white thumb left. 150ms linear `left` transition.
 */
export function Toggle({ on, onChange, ariaLabel, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 54,
        height: 28,
        background: on ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
        border: "none",
        borderRadius: 2,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        transition: "background 150ms linear",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 28 : 2,
          width: 24,
          height: 24,
          background: on ? "#0b0b0b" : "rgba(255,255,255,0.35)",
          borderRadius: 2,
          transition: "left 150ms linear, background 150ms linear",
          display: "block",
        }}
      />
    </button>
  );
}
