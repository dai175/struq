import { useI18n } from "@/i18n";
import { MetaTag } from "@/ui/meta-tag";

interface ModeSelectOverlayProps {
  /** BPM of the song. When null/undefined/<=0, the auto button is disabled. */
  bpm: number | null | undefined;
  onSelectManual: () => void;
  onSelectAuto: () => void;
}

export function ModeSelectOverlay({ bpm, onSelectManual, onSelectAuto }: ModeSelectOverlayProps) {
  const { t } = useI18n();
  const autoEnabled = typeof bpm === "number" && bpm > 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6" style={{ background: "var(--color-ink)" }}>
      <MetaTag color="var(--color-accent)">SELECT MODE</MetaTag>
      <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSelectManual}
          style={{
            flex: 1,
            padding: "48px 20px",
            border: "1px solid var(--color-line-2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--color-dim-2)",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            01
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{t.perform.modeSelect.manual}</div>
        </button>

        <button
          type="button"
          onClick={onSelectAuto}
          disabled={!autoEnabled}
          style={{
            flex: 1,
            padding: "48px 20px",
            border: "1px solid var(--color-accent)",
            background: autoEnabled ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent",
            color: autoEnabled ? "var(--color-accent)" : "var(--color-dim-2)",
            cursor: autoEnabled ? "pointer" : "not-allowed",
            opacity: autoEnabled ? 1 : 0.4,
            borderRadius: 2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: autoEnabled ? "var(--color-accent)" : "var(--color-dim-2)",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            02
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{t.perform.modeSelect.auto}</div>
          {!autoEnabled && (
            <div
              style={{
                marginTop: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
                color: "var(--color-dim-2)",
                textTransform: "uppercase",
              }}
            >
              {t.perform.modeSelect.bpmRequired}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
