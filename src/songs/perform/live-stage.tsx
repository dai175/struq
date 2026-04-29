import { getSectionLabel, useI18n } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";
import { BarGrid } from "@/songs/perform/bar-grid";
import { BeatRow } from "@/songs/perform/beat-row";
import { StageCard } from "@/songs/perform/stage-card";
import type { PerformMode } from "@/songs/perform/types";
import { sectionBeats } from "@/songs/perform-utils";
import type { SectionRow } from "@/songs/server-fns";

export function LiveStage({
  current,
  next,
  mode,
  bpm,
  currentBar,
  currentBeat,
  locale,
  isSetlistMode,
  hasNextSong,
  nextSongTitle,
}: {
  current: SectionRow;
  next: SectionRow | null;
  mode: PerformMode;
  bpm: number | null;
  currentBar: number;
  currentBeat: number;
  locale: Locale;
  isSetlistMode: boolean;
  hasNextSong: boolean;
  nextSongTitle: string | null;
}) {
  const { t } = useI18n();
  const sectionColor = SECTION_COLORS[current.type];
  const showAutoExtras = mode === "auto" || mode === "paused";

  return (
    <div
      className="flex flex-1 flex-col lg:grid"
      style={{
        padding: "28px 22px",
        gap: 24,
        gridTemplateColumns: "1.2fr 1fr",
      }}
    >
      <div className="flex flex-col items-start justify-center">
        <span
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: sectionColor,
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
              background: sectionColor,
            }}
          />
          NOW
        </span>
        <div
          style={{
            marginTop: 10,
            fontSize: "clamp(72px, 18vw, 160px)",
            fontWeight: 800,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            color: sectionColor,
            textShadow: "var(--glow-section)",
            wordBreak: "break-word",
          }}
        >
          {getSectionLabel(current.type, locale, current.label)}
        </div>
        <BarGrid total={current.bars} currentBar={currentBar} color={sectionColor} tracking={mode !== "manual"} />
        <div
          className="mt-4 flex gap-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--color-dim-2)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <span>
            {mode === "manual"
              ? `${String(current.bars).padStart(2, "0")} BARS`
              : `BAR ${String(Math.max(currentBar, 0) + 1).padStart(2, "0")} OF ${String(current.bars).padStart(2, "0")}`}
          </span>
          <span>{sectionBeats(current)} BEATS</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {current.chordProgression && (
          <StageCard label="CHORD PROGRESSION">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "0.22em",
                color: "var(--color-text-strong)",
                wordBreak: "break-word",
              }}
            >
              {current.chordProgression}
            </p>
          </StageCard>
        )}
        {showAutoExtras && (
          <StageCard label="BEAT" right={bpm ? `${bpm} BPM` : undefined}>
            <BeatRow currentBeat={currentBeat} bpm={bpm} color={sectionColor} />
          </StageCard>
        )}
        {current.memo && (
          <StageCard label="MEMO">
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1.5,
                color: "var(--color-text-strong)",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {current.memo}
            </p>
          </StageCard>
        )}
        {next ? (
          <StageCard label="UP NEXT" tone="dim">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  background: SECTION_COLORS[next.type],
                }}
              />
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--color-text-strong)",
                }}
              >
                {getSectionLabel(next.type, locale, next.label)}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--color-dim-2)",
                  textTransform: "uppercase",
                }}
              >
                {next.bars} BARS
              </span>
            </div>
          </StageCard>
        ) : isSetlistMode && hasNextSong && nextSongTitle ? (
          <StageCard label="UP NEXT · SONG" tone="dim">
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--color-text-strong)",
                }}
                className="truncate"
              >
                {nextSongTitle}
              </span>
            </div>
          </StageCard>
        ) : (
          <StageCard label="UP NEXT" tone="dim">
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-dim-2)",
                letterSpacing: "0.02em",
              }}
            >
              {t.common.end}
            </span>
          </StageCard>
        )}
        {mode === "paused" && (
          <div
            style={{
              padding: "10px 12px",
              border: "1px dashed var(--color-accent)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {t.perform.paused.tapToResume}
          </div>
        )}
      </div>
    </div>
  );
}
