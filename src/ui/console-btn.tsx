import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "accent" | "coral" | "inverse";

interface ConsoleBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  tone?: Tone;
  /** Render a small amount of meta text (JBM 10/0.22em). */
  metaLabel?: boolean;
  children: ReactNode;
}

const TONE_STYLES: Record<
  Tone,
  {
    background: string;
    color: string;
    border: string;
  }
> = {
  neutral: {
    background: "transparent",
    color: "var(--color-text)",
    border: "1px solid var(--color-line-2)",
  },
  accent: {
    background: "var(--color-accent)",
    color: "var(--color-text-on-accent)",
    border: "1px solid var(--color-accent)",
  },
  coral: {
    background: "transparent",
    color: "var(--color-section-solo)",
    border: "1px solid var(--color-section-solo)",
  },
  inverse: {
    background: "var(--color-text-strong)",
    color: "var(--color-ink)",
    border: "1px solid var(--color-text-strong)",
  },
};

/**
 * ConsoleBtn — outlined broadcast button. 2px corner radius (console
 * aesthetic: no pills). Meta-label variant renders children in JBM UPPERCASE.
 */
export function ConsoleBtn({
  tone = "neutral",
  metaLabel = true,
  className,
  style,
  children,
  ...rest
}: ConsoleBtnProps) {
  const t = TONE_STYLES[tone];
  return (
    <button
      {...rest}
      className={className}
      style={{
        ...t,
        padding: "9px 14px",
        borderRadius: 2,
        fontFamily: metaLabel ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: metaLabel ? 10 : 14,
        letterSpacing: metaLabel ? "0.22em" : 0,
        textTransform: metaLabel ? "uppercase" : "none",
        fontWeight: 600,
        cursor: rest.disabled ? "not-allowed" : "pointer",
        opacity: rest.disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
