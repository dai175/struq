import type { CSSProperties, ReactNode } from "react";

interface MetaTagProps {
  children: ReactNode;
  /** px, 9–11 typical. Default 10. */
  size?: number;
  /** Explicit text color — defaults to --color-dim-2 (35% white). */
  color?: string;
  /** Extra inline style overrides (e.g. marginTop, letterSpacing adjustments). */
  style?: CSSProperties;
  className?: string;
}

/**
 * MetaTag — the broadcast console's ever-present small label.
 * JetBrains Mono, 0.22em tracking, UPPERCASE, dim by default.
 * Below ~10px, bumps weight to 500 for legibility on OLED surfaces.
 */
export function MetaTag({ children, size = 10, color = "var(--color-dim-2)", style, className }: MetaTagProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: size,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: size <= 10 ? 500 : 400,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
