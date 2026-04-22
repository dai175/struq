import { useI18n } from "@/i18n";
import { SECTION_TYPES, type SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";

interface SectionPaletteProps {
  onAdd: (type: SectionType) => void;
}

/**
 * 4×2 grid of section-type chips used in the song editor. Each chip shows
 * a colored swatch + localized label, and appends a fresh section of that
 * type when clicked.
 */
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
      {SECTION_TYPES.map((type) => {
        const color = SECTION_COLORS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 10px",
              border: "1px solid var(--color-line)",
              background: "transparent",
              color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 2,
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                background: color,
                flexShrink: 0,
              }}
            />
            <span className="truncate">{t.section[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
