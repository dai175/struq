import type { ReactNode } from "react";

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

/**
 * TopBar — mobile screen header. 3-column grid (left action · title+subtitle ·
 * right actions). Title renders left-aligned and truncates on overflow; pass a
 * `<MetaTag>` as `subtitle` for the JBM meta row beneath the title.
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
      <div style={{ minWidth: 0 }}>
        {typeof title === "string" ? (
          <div className="truncate" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
            {title}
          </div>
        ) : (
          title
        )}
        {subtitle && <div style={{ marginTop: 3 }}>{subtitle}</div>}
      </div>
      <div className="flex items-center" style={{ gap: 6 }}>
        {right}
      </div>
    </header>
  );
}
