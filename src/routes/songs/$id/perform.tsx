import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { getSectionLabel, useI18n } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { type ClickScheduleHandle, scheduleClicks, unlockAudio } from "@/lib/audio";
import { getSetlist, type SetlistSongItem } from "@/setlists/server-fns";
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
import { SECTION_COLORS } from "@/songs/constants";
import { calculateSectionDurationMs, msPerBeat, sectionBeats } from "@/songs/perform-utils";
import { getSongWithSections, type SectionRow, type SongRow } from "@/songs/server-fns";
import { useCurrentBar } from "@/songs/use-current-bar";
import { useCurrentBeat } from "@/songs/use-current-beat";
import { useSectionTimer } from "@/songs/use-section-timer";
import { IconBack } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { C } from "@/ui/tokens";

type PerformSearch = { setlistId?: string };

export const Route = createFileRoute("/songs/$id/perform")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): PerformSearch => ({
    setlistId: typeof search.setlistId === "string" ? search.setlistId : undefined,
  }),
  loaderDeps: ({ search }) => ({ setlistId: search.setlistId }),
  loader: async ({ params, deps }) => {
    const [songData, setlistData] = await Promise.all([
      getSongWithSections({ data: { songId: params.id } }),
      deps.setlistId ? getSetlist({ data: { setlistId: deps.setlistId } }) : null,
    ]);
    if (!songData) throw redirect({ to: "/songs" });
    return { ...songData, setlistData };
  },
  component: PerformPage,
});

function PerformPage() {
  const { song, sections, setlistData } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { setlistId } = Route.useSearch();

  return (
    <PerformView key={id} song={song} sections={sections} setlistData={setlistData} songId={id} setlistId={setlistId} />
  );
}

function sectionLabel(section: SectionRow, locale: Locale): string {
  return getSectionLabel(section.type, locale, section.label);
}

const SAFE_AREA_STYLE = {
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
} as const;

type Mode = "selecting" | "manual" | "preroll" | "countin" | "auto" | "paused";

function isRunningMode(mode: Mode): boolean {
  return mode === "auto" || mode === "countin" || mode === "preroll";
}

function PerformView({
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
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("selecting");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clickEnabled] = useClickPreference();
  const [clickVolume] = useClickVolume();
  const [clickSound] = useClickSound();
  const [countIn] = useCountIn();
  const [preRollBars] = usePreRollBars();
  const [accentDownbeat] = useAccentDownbeat();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  const setlistSongs = setlistData?.songs ?? [];
  const currentSongIdx = setlistSongs.findIndex((s) => s.songId === songId);
  const isSetlistMode = !!setlistId && currentSongIdx >= 0;
  const hasNextSong = isSetlistMode && currentSongIdx < setlistSongs.length - 1;
  const hasPrevSong = isSetlistMode && currentSongIdx > 0;

  const total = sections.length;
  const isEnded = currentIndex >= total;
  const current = !isEnded ? sections[currentIndex] : undefined;
  const next = currentIndex < total - 1 ? sections[currentIndex + 1] : null;
  const sectionColor = current ? SECTION_COLORS[current.type] : "";

  const sectionDurationMs = current && song.bpm ? calculateSectionDurationMs(current, song.bpm) : 0;

  useSectionTimer({
    durationMs: sectionDurationMs,
    onComplete: advanceSection,
    isRunning: mode === "auto",
    sectionId: currentIndex,
  });

  const currentBar = useCurrentBar({
    bpm: song.bpm,
    totalBars: current?.bars ?? 0,
    isRunning: mode === "auto",
    sectionId: currentIndex,
  });

  const currentBeat = useCurrentBeat({
    bpm: song.bpm,
    totalBeats: current ? sectionBeats(current) : 0,
    isRunning: mode === "auto",
    sectionId: currentIndex,
  });

  const clickHandleRef = useRef<ClickScheduleHandle | null>(null);
  const clickElapsedMsRef = useRef(0);
  const clickSectionIdRef = useRef(currentIndex);
  useEffect(() => {
    clickHandleRef.current?.cancel();
    clickHandleRef.current = null;

    if (clickSectionIdRef.current !== currentIndex) {
      clickSectionIdRef.current = currentIndex;
      clickElapsedMsRef.current = 0;
    }

    if (mode !== "auto" || !clickEnabled || !current || !song.bpm) return;

    const startedAt = performance.now();
    clickHandleRef.current = scheduleClicks(song.bpm, sectionBeats(current), {
      elapsedMsAtStart: clickElapsedMsRef.current,
      volumePercent: clickVolume,
      sound: clickSound,
      accentDownbeat,
    });
    return () => {
      clickHandleRef.current?.cancel();
      clickHandleRef.current = null;
      clickElapsedMsRef.current += performance.now() - startedAt;
    };
  }, [mode, clickEnabled, clickVolume, clickSound, accentDownbeat, current, song.bpm, currentIndex]);

  useEffect(() => {
    if (mode !== "countin" || !clickEnabled || !song.bpm) return;
    const handle = scheduleClicks(song.bpm, 4, {
      volumePercent: clickVolume,
      sound: clickSound,
      accentDownbeat,
    });
    return () => handle.cancel();
  }, [mode, clickEnabled, song.bpm, clickVolume, clickSound, accentDownbeat]);

  function navigateToSong(target: SetlistSongItem) {
    navigate({
      to: "/songs/$id/perform",
      params: { id: target.songId },
      search: { setlistId },
    });
  }

  function advanceSection() {
    if (total === 0 || isEnded) return;
    if (currentIndex >= total - 1) {
      if (isSetlistMode && hasNextSong) {
        navigateToSong(setlistSongs[currentSongIdx + 1]);
      } else {
        setCurrentIndex(total);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function handleBack() {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
    if (isRunningMode(mode)) {
      setMode("paused");
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    if (isRunningMode(mode)) {
      setMode("paused");
    }
  }

  function goExit() {
    if (setlistId) {
      navigate({ to: "/setlists/$id", params: { id: setlistId } });
    } else {
      navigate({ to: "/songs/$id", params: { id: songId } });
    }
  }

  function handleSelectManual() {
    setMode("manual");
  }

  function handleSelectAuto() {
    unlockAudio();
    if (preRollBars > 0) {
      setMode("preroll");
    } else if (countIn) {
      setMode("countin");
    } else {
      setMode("auto");
    }
  }

  function handlePreRollComplete() {
    setMode(countIn ? "countin" : "auto");
  }

  function handleCountInComplete() {
    setMode("auto");
  }

  function handlePrimaryAction() {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    switch (mode) {
      case "selecting":
        return;
      case "manual":
        advanceSection();
        return;
      case "preroll":
      case "countin":
      case "auto":
        setMode("paused");
        return;
      case "paused":
        setMode("auto");
        return;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipedRef.current = false;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (mode === "selecting") return;

    if (isSetlistMode) {
      if (dx > 0 && hasPrevSong) {
        swipedRef.current = true;
        navigateToSong(setlistSongs[currentSongIdx - 1]);
      } else if (dx < 0 && hasNextSong) {
        swipedRef.current = true;
        navigateToSong(setlistSongs[currentSongIdx + 1]);
      }
    }
  }

  const handlersRef = useRef({ handlePrimaryAction, handleBack, handleReset, goExit });
  handlersRef.current = { handlePrimaryAction, handleBack, handleReset, goExit };
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case " ":
        case "ArrowRight":
          e.preventDefault();
          handlersRef.current.handlePrimaryAction();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlersRef.current.handleBack();
          break;
        case "r":
        case "R":
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (modeRef.current === "selecting") return;
          e.preventDefault();
          handlersRef.current.handleReset();
          break;
        case "Escape":
          handlersRef.current.goExit();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const metaParts: string[] = [];
  if (song.artist) metaParts.push(song.artist.toUpperCase());
  if (song.bpm) metaParts.push(`${song.bpm} BPM`);
  if (song.key) metaParts.push(`KEY ${song.key}`);

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
      {/* ─── Timeline rail (PC only) ─── */}
      {total > 0 && mode !== "selecting" && (
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
                    {sectionLabel(sec, locale)}
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
      )}

      {/* ─── Main stage ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3"
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <button
            type="button"
            onClick={goExit}
            aria-label={t.common.back}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-strong)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <IconBack size={20} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-strong)" }}>
              {song.title}
            </div>
            {metaParts.length > 0 && (
              <div style={{ marginTop: 3 }}>
                <MetaTag size={9}>{metaParts.join(" · ")}</MetaTag>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            aria-label={t.common.reset}
            style={{
              minWidth: 36,
              height: 36,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-dim)",
              background: "transparent",
              border: "1px solid var(--color-line-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            {t.common.reset}
          </button>
        </header>

        {mode === "selecting" ? (
          <ModeSelectOverlay bpm={song.bpm} onSelectManual={handleSelectManual} onSelectAuto={handleSelectAuto} />
        ) : mode === "preroll" && song.bpm ? (
          <PreRollOverlay bpm={song.bpm} bars={preRollBars} onComplete={handlePreRollComplete} />
        ) : mode === "countin" && song.bpm ? (
          <CountInOverlay bpm={song.bpm} onComplete={handleCountInComplete} />
        ) : (
          <>
            {total > 0 && !isEnded && current && (
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
                      SONG {String(currentSongIdx + 1).padStart(2, "0")}/{String(setlistSongs.length).padStart(2, "0")}
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
                onClick={handlePrimaryAction}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePrimaryAction();
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
                {isEnded ? (
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
                          textShadow: `0 0 30px color-mix(in srgb, ${sectionColor} 28%, transparent)`,
                          wordBreak: "break-word",
                        }}
                      >
                        {sectionLabel(current, locale)}
                      </div>
                      {(mode === "auto" || mode === "paused") && (
                        <BarGrid total={current.bars} currentBar={currentBar} color={sectionColor} />
                      )}
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
                          BAR {String(Math.max(currentBar, 0) + 1).padStart(2, "0")}
                          {" OF "}
                          {String(current.bars).padStart(2, "0")}
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
                      {(mode === "auto" || mode === "paused") && (
                        <StageCard label="BEAT" right={song.bpm ? `${song.bpm} BPM` : undefined}>
                          <BeatRow currentBeat={currentBeat} bpm={song.bpm} color={sectionColor} />
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
                              {sectionLabel(next, locale)}
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
                      ) : isSetlistMode && hasNextSong ? (
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
                              {setlistSongs[currentSongIdx + 1].title}
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
                ) : null}
              </button>
            )}

            {total > 0 && (
              <footer
                className="flex items-center justify-between"
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid var(--color-line)",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  style={{
                    minWidth: 80,
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px solid var(--color-line-2)",
                    color: currentIndex === 0 ? "var(--color-dim-2)" : "var(--color-text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    opacity: currentIndex === 0 ? 0.4 : 1,
                    borderRadius: 2,
                  }}
                >
                  ◁ {t.common.back}
                </button>
                <MetaTag size={9}>SPACE · TAP TO ADVANCE</MetaTag>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    minWidth: 80,
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px solid var(--color-line-2)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                >
                  {t.common.reset}
                </button>
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StageCard({
  label,
  right,
  tone = "default",
  children,
}: {
  label: string;
  right?: string;
  tone?: "default" | "dim";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        background: tone === "dim" ? "transparent" : "var(--color-bg-elevated)",
        padding: "12px 14px",
      }}
    >
      <div className="flex items-center justify-between">
        <MetaTag size={10}>{label}</MetaTag>
        {right && <MetaTag size={9}>{right}</MetaTag>}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function BarGrid({ total, currentBar, color }: { total: number; currentBar: number; color: string }) {
  return (
    <div
      className="mt-4 grid"
      style={{
        gridTemplateColumns: `repeat(${Math.min(total, 16)}, minmax(0, 1fr))`,
        gap: 4,
        width: "100%",
        maxWidth: 420,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i === currentBar;
        const past = i < currentBar;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, never reordered
            key={i}
            style={{
              height: 18,
              background: active || past ? color : "transparent",
              border: `1px solid ${color}`,
              opacity: active ? 1 : past ? 0.7 : 0.25,
            }}
          />
        );
      })}
    </div>
  );
}

function BeatRow({ currentBeat, bpm, color }: { currentBeat: number; bpm: number | null; color: string }) {
  const beats = 4;
  const beatInBar = bpm && currentBeat >= 0 ? currentBeat % beats : -1;
  return (
    <div className="flex gap-2">
      {Array.from({ length: beats }, (_, i) => {
        const active = i === beatInBar;
        const past = i < beatInBar;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, never reordered
            key={i}
            style={{
              width: 38,
              height: 38,
              background: active ? color : "transparent",
              border: `1px solid ${color}`,
              opacity: active ? 1 : past ? 0.45 : 0.2,
              boxShadow: active ? `0 0 14px color-mix(in srgb, ${color} 55%, transparent)` : undefined,
              animation: active && bpm ? `beat-pop 80ms ease-out` : undefined,
              animationDuration: active && bpm ? `${Math.min(msPerBeat(bpm) * 0.6, 180)}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
