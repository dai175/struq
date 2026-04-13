import type { SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";

interface StructurePreviewProps {
  sections: { id: string; type: SectionType; bars: number }[];
}

export function StructurePreview({ sections }: StructurePreviewProps) {
  if (sections.length === 0) return null;

  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
      {sections.map((sec) => (
        <div
          key={sec.id}
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
