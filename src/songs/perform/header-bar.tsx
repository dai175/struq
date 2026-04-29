import { useI18n } from "@/i18n";
import { IconBack } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

export function HeaderBar({
  title,
  metaParts,
  onBack,
  onReset,
}: {
  title: string;
  metaParts: string[];
  onBack: () => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  return (
    <header
      className="flex items-center gap-3"
      style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={t.common.back}
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-strong)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <IconBack size={20} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-strong)" }}>
          {title}
        </div>
        {metaParts.length > 0 && (
          <div style={{ marginTop: 3 }}>
            <MetaTag size={9}>{metaParts.join(" · ")}</MetaTag>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onReset}
        aria-label={t.common.reset}
        style={{
          minWidth: 36,
          height: 36,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-dim)",
          background: "transparent",
          border: "1px solid var(--color-line-2)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
          borderRadius: 2,
        }}
      >
        {t.common.reset}
      </button>
    </header>
  );
}
