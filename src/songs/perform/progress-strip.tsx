import { SECTION_COLORS } from "@/songs/constants";
import type { SectionRow } from "@/songs/server-fns";
import { MetaTag } from "@/ui/meta-tag";

export function ProgressStrip({
  sections,
  currentIndex,
  total,
  isSetlistMode,
  currentSongIdx,
  setlistTotal,
}: {
  sections: SectionRow[];
  currentIndex: number;
  total: number;
  isSetlistMode: boolean;
  currentSongIdx: number;
  setlistTotal: number;
}) {
  return (
    <div
      style={{
        padding: "12px 20px 16px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div className="flex items-center justify-between">
        <MetaTag>
          SECTION {String(currentIndex + 1).padStart(2, "0")} OF {String(total).padStart(2, "0")}
        </MetaTag>
        {isSetlistMode && (
          <MetaTag size={9}>
            SONG {String(currentSongIdx + 1).padStart(2, "0")}/{String(setlistTotal).padStart(2, "0")}
          </MetaTag>
        )}
      </div>
      <div className="mt-3 flex gap-0.5">
        {sections.map((sec, i) => (
          <div
            key={sec.id}
            style={{
              flex: sec.bars,
              minWidth: 2,
              height: 6,
              background: SECTION_COLORS[sec.type],
              opacity: i <= currentIndex ? 1 : 0.25,
            }}
          />
        ))}
      </div>
    </div>
  );
}
