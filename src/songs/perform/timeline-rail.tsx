import { getSectionLabel } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";
import type { SectionRow, SongRow } from "@/songs/server-fns";
import { MetaTag } from "@/ui/meta-tag";
import { C } from "@/ui/tokens";

export function TimelineRail({
  song,
  sections,
  currentIndex,
  isEnded,
  metaParts,
  locale,
}: {
  song: SongRow;
  sections: SectionRow[];
  currentIndex: number;
  isEnded: boolean;
  metaParts: string[];
  locale: Locale;
}) {
  return (
    <aside
      className="hidden shrink-0 flex-col lg:flex"
      style={{
        width: 280,
        borderRight: "1px solid var(--color-line)",
        padding: "18px 16px",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: C.live,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.live,
              boxShadow: `0 0 8px ${C.live}`,
              animation: "live-pulse 1.2s ease-in-out infinite",
            }}
          />
          LIVE
        </span>
        <MetaTag size={10}>ESC · EXIT</MetaTag>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="truncate" style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-strong)" }}>
          {song.title}
        </div>
        {metaParts.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <MetaTag size={10}>{metaParts.join(" · ")}</MetaTag>
          </div>
        )}
      </div>

      <ul className="mt-4 flex-1 overflow-y-auto" style={{ borderTop: "1px solid var(--color-line)" }}>
        {sections.map((sec, i) => {
          const active = i === currentIndex && !isEnded;
          const past = i < currentIndex || isEnded;
          return (
            <li
              key={sec.id}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 10px 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "10px 2px 10px 6px",
                borderBottom: "1px solid var(--color-line)",
                borderLeft: active ? `3px solid ${SECTION_COLORS[sec.type]}` : "3px solid transparent",
                background: active ? "var(--color-bg-elevated-hover)" : "transparent",
                color: active ? "var(--color-text-strong)" : past ? "var(--color-dim)" : "var(--color-dim-2)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--color-dim-2)",
                  letterSpacing: "0.08em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  background: past || active ? SECTION_COLORS[sec.type] : "transparent",
                  border: `1px solid ${SECTION_COLORS[sec.type]}`,
                }}
              />
              <span className="truncate" style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>
                {getSectionLabel(sec.type, locale, sec.label)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--color-dim-2)",
                }}
              >
                {sec.bars}b
              </span>
            </li>
          );
        })}
      </ul>

      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 12,
          paddingTop: 14,
          borderTop: "1px solid var(--color-line)",
        }}
      >
        <div>
          <MetaTag size={9}>BPM</MetaTag>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-text-strong)",
              letterSpacing: "0.02em",
              marginTop: 2,
            }}
          >
            {song.bpm ?? "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <MetaTag size={9}>KEY</MetaTag>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-text-strong)",
              letterSpacing: "0.02em",
              marginTop: 2,
            }}
          >
            {song.key ?? "—"}
          </div>
        </div>
      </div>
    </aside>
  );
}
