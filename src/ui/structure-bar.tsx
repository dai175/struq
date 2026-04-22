import type { CSSProperties } from "react";
import type { SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";

export interface StructureBarSection {
  id: string;
  type: SectionType;
  bars: number;
  /** Optional label (e.g. "A", "Chorus") used when `showAbbreviations` is on. */
  label?: string | null;
}

interface StructureBarProps {
  sections: StructureBarSection[];
  /** Bar height in px. 3 (list rows), 4–5 (mobile thumbnails), 6 (meter strip), 10 (hero + setlist detail). */
  height?: number;
  /** Render a row of 3-letter abbreviations beneath each segment. */
  showAbbreviations?: boolean;
  /** `default` = solid colors; `dim` = 45% opacity for up-next / reference. */
  tone?: "default" | "dim";
  /** Gap between segments in px. 1 (detail bar) or 0 (compact thumbnails). */
  gap?: number;
  className?: string;
  style?: CSSProperties;
}

function abbr(label: string | null | undefined, type: SectionType): string {
  if (label) return label.slice(0, 3).toUpperCase();
  return type.slice(0, 3).toUpperCase();
}

/**
 * StructureBar — flex-weighted segmented bar. Each segment's width is
 * proportional to its `bars` count, colored by its section type. This is the
 * same primitive used at multiple densities across the app: Login hero,
 * Library rows, Setlist detail total, Perform meter strip, Song editor preview.
 */
export function StructureBar({
  sections,
  height = 3,
  showAbbreviations = false,
  tone = "default",
  gap = 1,
  className,
  style,
}: StructureBarProps) {
  if (sections.length === 0) return null;
  const opacity = tone === "dim" ? 0.45 : 1;

  return (
    <div className={className} style={style}>
      <div style={{ display: "flex", height, gap, overflow: "hidden" }}>
        {sections.map((sec) => (
          <div
            key={sec.id}
            style={{
              flex: Math.max(sec.bars, 0.5),
              minWidth: 2,
              backgroundColor: SECTION_COLORS[sec.type],
              opacity,
            }}
          />
        ))}
      </div>
      {showAbbreviations && (
        <div style={{ display: "flex", gap, marginTop: 6 }}>
          {sections.map((sec) => (
            <div
              key={`${sec.id}-label`}
              style={{
                flex: Math.max(sec.bars, 0.5),
                minWidth: 2,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.22em",
                color: "var(--color-dim-2)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {abbr(sec.label, sec.type)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
