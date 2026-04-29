import { Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { useI18n } from "@/i18n";
import type { getSetlist } from "@/setlists/server-fns";
import {
  useAccentDownbeat,
  useClickPreference,
  useClickSound,
  useClickVolume,
  useCountIn,
  usePreRollBars,
} from "@/songs/click-preference";
import { CountInOverlay } from "@/songs/components/count-in-overlay";
import { ModeSelectOverlay } from "@/songs/components/mode-select-overlay";
import { PreRollOverlay } from "@/songs/components/pre-roll-overlay";
import { FooterControls } from "@/songs/perform/footer-controls";
import { HeaderBar } from "@/songs/perform/header-bar";
import { LiveStage } from "@/songs/perform/live-stage";
import { ProgressStrip } from "@/songs/perform/progress-strip";
import { TimelineRail } from "@/songs/perform/timeline-rail";
import { SAFE_AREA_STYLE } from "@/songs/perform/types";
import { usePerformClicks } from "@/songs/perform/use-perform-clicks";
import { usePerformControls } from "@/songs/perform/use-perform-controls";
import { usePerformKeyboard } from "@/songs/perform/use-perform-keyboard";
import { calculateSectionDurationMs, sectionBeats } from "@/songs/perform-utils";
import type { SectionRow, SongRow } from "@/songs/server-fns";
import { useCurrentBar } from "@/songs/use-current-bar";
import { useCurrentBeat } from "@/songs/use-current-beat";
import { useSectionTimer } from "@/songs/use-section-timer";
import { MetaTag } from "@/ui/meta-tag";

export function PerformView({
  song,
  sections,
  setlistData,
  songId,
  setlistId,
}: {
  song: SongRow;
  sections: SectionRow[];
  setlistData: Awaited<ReturnType<typeof getSetlist>> | null;
  songId: string;
  setlistId?: string;
}) {
  const { t, locale } = useI18n();

  const [clickEnabled] = useClickPreference();
  const [clickVolume] = useClickVolume();
  const [clickSound] = useClickSound();
  const [countIn] = useCountIn();
  const [preRollBars] = usePreRollBars();
  const [accentDownbeat] = useAccentDownbeat();

  const setlistSongs = setlistData?.songs ?? [];
  const total = sections.length;

  const ctrl = usePerformControls({
    songId,
    setlistId,
    total,
    setlistSongs,
    countIn,
    preRollBars,
  });

  const current = !ctrl.isEnded ? sections[ctrl.currentIndex] : undefined;
  const next = ctrl.currentIndex < total - 1 ? sections[ctrl.currentIndex + 1] : null;

  const sectionDurationMs = current && song.bpm ? calculateSectionDurationMs(current, song.bpm) : 0;

  useSectionTimer({
    durationMs: sectionDurationMs,
    onComplete: ctrl.advanceSection,
    isRunning: ctrl.mode === "auto",
    sectionId: ctrl.currentIndex,
  });

  const currentBar = useCurrentBar({
    bpm: song.bpm,
    totalBars: current?.bars ?? 0,
    isRunning: ctrl.mode === "auto",
    sectionId: ctrl.currentIndex,
  });

  const currentBeat = useCurrentBeat({
    bpm: song.bpm,
    totalBeats: current ? sectionBeats(current) : 0,
    isRunning: ctrl.mode === "auto",
    sectionId: ctrl.currentIndex,
  });

  usePerformClicks({
    mode: ctrl.mode,
    current,
    bpm: song.bpm,
    currentIndex: ctrl.currentIndex,
    prefs: {
      enabled: clickEnabled,
      volumePercent: clickVolume,
      sound: clickSound,
      accentDownbeat,
    },
  });

  usePerformKeyboard(
    {
      primary: ctrl.handlePrimaryAction,
      back: ctrl.handleBack,
      reset: ctrl.handleReset,
      exit: ctrl.goExit,
    },
    ctrl.mode,
  );

  // Touch swipe between songs in setlist mode
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    ctrl.handleTouchSwipe(dx);
  }

  const metaParts = useMemo(() => {
    const parts: string[] = [];
    if (song.artist) parts.push(song.artist.toUpperCase());
    if (song.bpm) parts.push(`${song.bpm} BPM`);
    if (song.key) parts.push(`KEY ${song.key}`);
    return parts;
  }, [song.artist, song.bpm, song.key]);

  return (
    <div
      className="fixed inset-0 flex select-none flex-col lg:flex-row"
      style={{
        ...SAFE_AREA_STYLE,
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {total > 0 && ctrl.mode !== "selecting" && (
        <TimelineRail
          song={song}
          sections={sections}
          currentIndex={ctrl.currentIndex}
          isEnded={ctrl.isEnded}
          metaParts={metaParts}
          locale={locale}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderBar title={song.title} metaParts={metaParts} onBack={ctrl.goExit} onReset={ctrl.handleReset} />

        {ctrl.mode === "selecting" ? (
          <ModeSelectOverlay
            bpm={song.bpm}
            onSelectManual={ctrl.handleSelectManual}
            onSelectAuto={ctrl.handleSelectAuto}
          />
        ) : ctrl.mode === "preroll" && song.bpm ? (
          <PreRollOverlay bpm={song.bpm} bars={preRollBars} onComplete={ctrl.handlePreRollComplete} />
        ) : ctrl.mode === "countin" && song.bpm ? (
          <CountInOverlay bpm={song.bpm} onComplete={ctrl.handleCountInComplete} />
        ) : (
          <>
            {total > 0 && !ctrl.isEnded && current && (
              <ProgressStrip
                sections={sections}
                currentIndex={ctrl.currentIndex}
                total={total}
                isSetlistMode={ctrl.isSetlistMode}
                currentSongIdx={ctrl.currentSongIdx}
                setlistTotal={setlistSongs.length}
              />
            )}

            {total === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6">
                <MetaTag>NO SECTIONS</MetaTag>
                <p
                  style={{
                    marginTop: 12,
                    color: "var(--color-dim)",
                    fontSize: 14,
                  }}
                >
                  {t.song.noSections}
                </p>
                <Link
                  to="/songs/$id"
                  params={{ id: songId }}
                  style={{
                    marginTop: 16,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                    border: "1px solid var(--color-accent)",
                    padding: "10px 16px",
                  }}
                >
                  BACK TO EDITOR
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className="flex flex-1 cursor-pointer flex-col"
                onClick={ctrl.handlePrimaryAction}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    ctrl.handlePrimaryAction();
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                {ctrl.isEnded ? (
                  <div className="flex flex-1 items-center justify-center">
                    <p
                      style={{
                        fontSize: 96,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: "var(--color-dim)",
                      }}
                    >
                      {t.common.end}
                    </p>
                  </div>
                ) : current ? (
                  <LiveStage
                    current={current}
                    next={next}
                    mode={ctrl.mode}
                    bpm={song.bpm}
                    currentBar={currentBar}
                    currentBeat={currentBeat}
                    locale={locale}
                    isSetlistMode={ctrl.isSetlistMode}
                    hasNextSong={ctrl.hasNextSong}
                    nextSongTitle={ctrl.hasNextSong ? setlistSongs[ctrl.currentSongIdx + 1].title : null}
                  />
                ) : null}
              </button>
            )}

            {total > 0 && (
              <FooterControls currentIndex={ctrl.currentIndex} onBack={ctrl.handleBack} onReset={ctrl.handleReset} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
