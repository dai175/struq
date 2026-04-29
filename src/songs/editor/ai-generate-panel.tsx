import { useI18n } from "@/i18n";
import { IconSparkles } from "@/ui/icons";

const AI_BETA_LABEL = "BETA";

export function AiGeneratePanel({
  generating,
  error,
  rateLimited,
  containerStyle,
  onGenerate,
  onRetry,
}: {
  generating: boolean;
  error: boolean;
  rateLimited: boolean;
  containerStyle?: React.CSSProperties;
  onGenerate: () => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="flex w-full items-center justify-center gap-2"
        style={{
          padding: 12,
          border: "1px solid var(--color-line-2)",
          background: "transparent",
          color: "var(--color-text-strong)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 500,
          cursor: generating ? "not-allowed" : "pointer",
          opacity: generating ? 0.5 : 1,
          borderRadius: 1,
        }}
      >
        <IconSparkles size={14} />
        {generating ? t.common.loading : t.song.aiGenerate}
        <span
          style={{
            marginLeft: 4,
            padding: "1px 5px",
            border: "1px solid var(--color-line-2)",
            color: "var(--color-dim)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
        >
          {AI_BETA_LABEL}
        </span>
      </button>
      <p
        style={{
          marginTop: 6,
          fontSize: 11,
          color: "var(--color-dim)",
          lineHeight: 1.5,
        }}
      >
        {t.song.aiExperimentalNote}
      </p>
      {rateLimited && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            border: "1px solid var(--color-section-chorus)",
            background: "color-mix(in srgb, var(--color-section-chorus) 10%, transparent)",
            color: "var(--color-section-chorus)",
            fontSize: 13,
          }}
        >
          {t.song.aiRateLimited}
        </div>
      )}
      {error && (
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 8,
            padding: "10px 12px",
            border: "1px solid var(--color-section-solo)",
            background: "color-mix(in srgb, var(--color-section-solo) 10%, transparent)",
            color: "var(--color-section-solo)",
            fontSize: 13,
          }}
        >
          <span>{t.song.aiError}</span>
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-section-solo)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.common.retry}
          </button>
        </div>
      )}
    </div>
  );
}
