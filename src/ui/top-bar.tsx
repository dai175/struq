import type { ReactNode } from "react";

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

/**
 * TopBar — mobile screen header. 3-column grid (left action · centered title
 * stack · right actions). Subtitle renders as JBM meta below the title.
 */
export function TopBar({ title, subtitle, left, right }: TopBarProps) {
  return (
    <header
      className="grid items-center gap-3 border-b lg:hidden"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        padding: "14px 18px",
        background: "var(--color-ink)",
        borderColor: "var(--color-line)",
      }}
    >
      <div style={{ minWidth: 32 }}>{left}</div>
      <div style={{ textAlign: "center", minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              color: "var(--color-dim-2)",
              marginTop: 3,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          minWidth: 32,
          textAlign: "right",
          display: "flex",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        {right}
      </div>
    </header>
  );
}
