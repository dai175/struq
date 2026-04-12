import { SECTION_TYPES, type SectionType } from "@/i18n/types";
import { useI18n } from "@/i18n";

const SECTION_COLORS: Record<SectionType, string> = {
  intro: "var(--color-section-intro)",
  a: "var(--color-section-a)",
  b: "var(--color-section-b)",
  chorus: "var(--color-section-chorus)",
  bridge: "var(--color-section-bridge)",
  solo: "var(--color-section-solo)",
  outro: "var(--color-section-outro)",
  custom: "var(--color-section-custom)",
};

interface SectionPaletteProps {
  onAdd: (type: SectionType) => void;
}

export function SectionPalette({ onAdd }: SectionPaletteProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-secondary">{t.song.addSection}</p>
      <div className="flex flex-wrap gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-opacity active:opacity-70"
            style={{
              backgroundColor: `color-mix(in srgb, ${SECTION_COLORS[type]} 15%, transparent)`,
              color: SECTION_COLORS[type],
            }}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: SECTION_COLORS[type] }}
            />
            {t.section[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
