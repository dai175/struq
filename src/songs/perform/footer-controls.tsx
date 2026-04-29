import { useI18n } from "@/i18n";
import { MetaTag } from "@/ui/meta-tag";

export function FooterControls({
  currentIndex,
  onBack,
  onReset,
}: {
  currentIndex: number;
  onBack: () => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const atStart = currentIndex === 0;
  return (
    <footer
      className="flex items-center justify-between"
      style={{
        padding: "12px 18px",
        borderTop: "1px solid var(--color-line)",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={atStart}
        style={{
          minWidth: 80,
          padding: "10px 14px",
          background: "transparent",
          border: "1px solid var(--color-line-2)",
          color: atStart ? "var(--color-dim-2)" : "var(--color-text)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: atStart ? "not-allowed" : "pointer",
          opacity: atStart ? 0.4 : 1,
          borderRadius: 2,
        }}
      >
        ◁ {t.common.back}
      </button>
      <MetaTag size={9}>SPACE · TAP TO ADVANCE</MetaTag>
      <button
        type="button"
        onClick={onReset}
        style={{
          minWidth: 80,
          padding: "10px 14px",
          background: "transparent",
          border: "1px solid var(--color-line-2)",
          color: "var(--color-text)",
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
    </footer>
  );
}
