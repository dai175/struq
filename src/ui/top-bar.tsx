import type { ReactNode } from "react";

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

/**
 * TopBar — mobile screen header. 3-column grid (left action · title+subtitle ·
 * right actions). Title renders centered and truncates on overflow; `subtitle`
 * is rendered as a JBM uppercase meta row beneath the title — pass a plain
 * string (not a `<MetaTag>`) to avoid double styling.
 */
export function TopBar({ title, subtitle, left, right }: TopBarProps) {
  return (
    <header
      className="grid items-center gap-3 border-b lg:hidden"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        padding: "14px 18px",
        borderColor: "var(--color-line)",
      }}
    >
      <div style={{ minWidth: 32 }}>{left}</div>
      <div style={{ minWidth: 0, textAlign: "center" }}>
        {typeof title === "string" ? (
          <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>
            {title}
          </div>
        ) : (
          title
        )}
        {subtitle && (
          <div
            style={{
              marginTop: 3,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.22em",
              lineHeight: 1,
              color: "var(--color-dim-2)",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center" style={{ gap: 6 }}>
        {right}
      </div>
    </header>
  );
}
