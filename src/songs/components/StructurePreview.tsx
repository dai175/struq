import type { SectionType } from "@/i18n/types";

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

interface StructurePreviewProps {
  sections: { type: SectionType; bars: number }[];
}

export function StructurePreview({ sections }: StructurePreviewProps) {
  if (sections.length === 0) return null;

  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
      {sections.map((sec, i) => (
        <div
          key={i}
          className="min-w-1 rounded-full"
          style={{
            flex: sec.bars,
            backgroundColor: SECTION_COLORS[sec.type],
          }}
        />
      ))}
    </div>
  );
}
