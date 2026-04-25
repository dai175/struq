import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { PALETTE_TYPES, SECTION_COLORS } from "@/songs/constants";

interface SectionPaletteProps {
  onAdd: (type: SectionType) => void;
}

export function SectionPalette({ onAdd }: SectionPaletteProps) {
  const { t } = useI18n();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 6,
      }}
    >
      {PALETTE_TYPES.map((type) => {
        const color = SECTION_COLORS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            style={{
              padding: "10px 4px",
              border: "1px solid var(--color-line)",
              borderRadius: 1,
              background: "var(--color-bg-elevated)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                background: color,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {t.section[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
