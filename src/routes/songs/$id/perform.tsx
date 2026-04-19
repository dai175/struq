import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { getSectionLabel, useI18n } from "@/i18n";
import type { Locale, Translations } from "@/i18n/types";
import { type ClickScheduleHandle, scheduleClicks, unlockAudio } from "@/lib/audio";
import { getSetlist, type SetlistSongItem } from "@/setlists/server-fns";
import { useClickPreference } from "@/songs/click-preference";
import { CountInOverlay } from "@/songs/components/count-in-overlay";
import { ModeSelectOverlay } from "@/songs/components/mode-select-overlay";
import { SECTION_COLORS } from "@/songs/constants";
import { calculateSectionDurationMs, msPerBeat, sectionBeats } from "@/songs/perform-utils";
import { getSongWithSections, type SectionRow, type SongRow } from "@/songs/server-fns";
import { useCurrentBar } from "@/songs/use-current-bar";
import { useCurrentBeat } from "@/songs/use-current-beat";
import { useSectionTimer } from "@/songs/use-section-timer";

// ─── Route ─────────────────────────────────────

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

// ─── Wrapper (key={id} forces remount on song change) ──

function PerformPage() {
  const { song, sections, setlistData } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { setlistId } = Route.useSearch();

  return (
    <PerformView key={id} song={song} sections={sections} setlistData={setlistData} songId={id} setlistId={setlistId} />
  );
}

// ─── Helpers ───────────────────────────────────

function formatBars(section: SectionRow, t: Translations): string {
  if (section.extraBeats > 0) {
    return t.common.barsWithExtra
      .replace("{bars}", String(section.bars))
      .replace("{extra}", String(section.extraBeats));
  }
  return `${section.bars} ${t.common.bars}`;
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

// ─── Main View ─────────────────────────────────

type Mode = "selecting" | "manual" | "countin" | "auto" | "paused";

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
  const prev = currentIndex > 0 && currentIndex <= total ? sections[currentIndex - 1] : null;
  const next = currentIndex < total - 1 ? sections[currentIndex + 1] : null;
  const sectionColor = current ? SECTION_COLORS[current.type] : "";

  // ── Auto-advance timer ────────────────────────
  // Compute even when not in auto mode so useSectionTimer initializes its
  // remaining-ms ref with the real value; isRunning still gates actual scheduling.
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

  // ── Click stream during auto ──────────────────
  const clickHandleRef = useRef<ClickScheduleHandle | null>(null);
  useEffect(() => {
    clickHandleRef.current?.cancel();
    clickHandleRef.current = null;
    if (mode === "auto" && clickEnabled && current && song.bpm) {
      clickHandleRef.current = scheduleClicks(song.bpm, sectionBeats(current));
    }
    return () => {
      clickHandleRef.current?.cancel();
      clickHandleRef.current = null;
    };
  }, [mode, clickEnabled, current, song.bpm]);

  // ── Count-in audio ────────────────────────────
  useEffect(() => {
    if (mode !== "countin" || !song.bpm) return;
    const handle = scheduleClicks(song.bpm, 4);
    return () => handle.cancel();
  }, [mode, song.bpm]);

  // ── Handlers ──────────────────────────────────

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
    // In auto mode, rewinding a section drops us into paused so the user
    // can take a breath before resuming.
    if (mode === "auto" || mode === "countin") {
      setMode("paused");
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    if (mode === "auto" || mode === "countin") {
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
    setMode("countin");
  }

  function handleCountInComplete() {
    setMode("auto");
  }

  // Central dispatcher for tap / Space / ArrowRight based on current mode.
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
      case "countin":
        setMode("paused");
        return;
      case "auto":
        setMode("paused");
        return;
      case "paused":
        setMode("auto");
        return;
    }
  }

  // ── Touch / Swipe ─────────────────────────────

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

  // ── Keyboard ──────────────────────────────────

  const handlersRef = useRef({ handlePrimaryAction, handleBack, handleReset, goExit });
  handlersRef.current = { handlePrimaryAction, handleBack, handleReset, goExit };

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
        case "Escape":
          handlersRef.current.goExit();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Meta line ─────────────────────────────────

  const metaParts: string[] = [];
  if (song.artist) metaParts.push(song.artist);
  if (song.bpm) metaParts.push(`${song.bpm} BPM`);
  if (song.key) metaParts.push(song.key);

  const showPausedHint = mode === "paused";
  const hasDetails = !!(current?.chordProgression || current?.memo);

  // Shared prev/next JSX so we can render them in the outer slots (portrait)
  // or inside the right-hand details column (landscape) without duplication.
  const prevLabel = prev ? <p className="text-base opacity-25 lg:text-xl">{sectionLabel(prev, locale)}</p> : null;

  const nextHint = showPausedHint ? (
    <p className="text-sm opacity-50">{t.perform.paused.tapToResume}</p>
  ) : next ? (
    <div className="opacity-30">
      <p className="text-[10px] uppercase tracking-widest">{t.common.next}</p>
      <p className="text-sm lg:text-base">{sectionLabel(next, locale)}</p>
    </div>
  ) : isSetlistMode && hasNextSong ? (
    <div className="opacity-25">
      <p className="text-[10px] uppercase tracking-widest">{t.common.next}</p>
      <p className="text-sm lg:text-base">{setlistSongs[currentSongIdx + 1].title}</p>
    </div>
  ) : (
    <p className="text-sm opacity-20">{t.common.end}</p>
  );

  // ── Render ────────────────────────────────────

  return (
    <div
      className="fixed inset-0 flex select-none flex-col bg-surface-dark text-text-on-dark"
      style={SAFE_AREA_STYLE}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Header ──────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 pb-2 pt-3 lg:px-8">
        <button
          type="button"
          onClick={goExit}
          className="shrink-0 rounded-full p-2 opacity-60 transition-opacity active:opacity-100"
          aria-label={t.common.back}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-semibold opacity-70 lg:text-base">{song.title}</h1>
          {metaParts.length > 0 && <p className="truncate text-xs opacity-40 lg:text-sm">{metaParts.join(" · ")}</p>}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="shrink-0 rounded-full p-2 opacity-60 transition-opacity active:opacity-100"
          aria-label={t.common.reset}
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {mode === "selecting" ? (
        <ModeSelectOverlay bpm={song.bpm} onSelectManual={handleSelectManual} onSelectAuto={handleSelectAuto} />
      ) : mode === "countin" && song.bpm ? (
        <CountInOverlay bpm={song.bpm} onComplete={handleCountInComplete} />
      ) : (
        <>
          {/* ── Progress bar ────────────────────────── */}
          {total > 0 && (
            <div className="flex gap-0.5 px-4 lg:px-8">
              {sections.map((sec, i) => (
                <div
                  key={sec.id}
                  className="h-2 min-w-1 rounded-full transition-opacity duration-150 lg:h-3"
                  style={{
                    flex: sec.bars,
                    backgroundColor: SECTION_COLORS[sec.type],
                    opacity: isEnded || i <= currentIndex ? 1 : 0.25,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Section counter ─────────────────────── */}
          {total > 0 && !isEnded && (
            <div className="mt-2 text-center">
              <span className="font-mono text-xs opacity-40 lg:text-sm">
                {currentIndex + 1}
                {t.perform.of}
                {total}
              </span>
              {isSetlistMode && (
                <span className="ml-3 text-xs opacity-30">
                  {t.perform.songOf
                    .replace("{current}", String(currentSongIdx + 1))
                    .replace("{total}", String(setlistSongs.length))}
                </span>
              )}
            </div>
          )}

          {/* ── Main tap area ───────────────────────── */}
          {total === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 lg:px-12">
              <div className="text-center">
                <p className="text-lg opacity-40">{t.song.noSections}</p>
                <Link
                  to="/songs/$id"
                  params={{ id: songId }}
                  className="mt-4 inline-block text-sm opacity-50 underline"
                >
                  {t.common.back}
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="flex flex-1 cursor-pointer flex-col items-center justify-center px-6 lg:px-12"
              onClick={handlePrimaryAction}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePrimaryAction();
                }
              }}
            >
              {isEnded ? (
                <p className="text-6xl font-bold opacity-50 lg:text-8xl">{t.common.end}</p>
              ) : current ? (
                <>
                  {/* Previous section — hidden in landscape when details column hosts it */}
                  <div className={`mb-6 h-7 lg:mb-8 lg:h-8${hasDetails ? " landscape:hidden" : ""}`}>{prevLabel}</div>

                  {/* Beat LED — reserved slot keeps layout stable across modes */}
                  <div className="mb-4 flex h-3 items-center justify-center lg:mb-6 lg:h-3.5">
                    {(mode === "auto" || mode === "paused") && <BeatStrip currentBeat={currentBeat} bpm={song.bpm} />}
                  </div>

                  <div className="flex w-full flex-col items-center text-center landscape:grid landscape:grid-cols-2 landscape:items-center landscape:gap-12 landscape:lg:gap-16">
                    <div className={`flex flex-col items-center${hasDetails ? "" : " landscape:col-span-2"}`}>
                      <p className="text-5xl font-bold lg:text-7xl" style={{ color: sectionColor }}>
                        {sectionLabel(current, locale)}
                      </p>
                      <p
                        className="mt-4 font-mono text-3xl font-bold opacity-90 lg:mt-6 lg:text-4xl"
                        style={{ color: sectionColor }}
                      >
                        {formatBars(current, t)}
                      </p>
                      {(mode === "auto" || mode === "paused") && (
                        <BarDots total={current.bars} currentBar={currentBar} color={sectionColor} />
                      )}
                    </div>
                    {hasDetails && (
                      <div className="flex flex-col items-center">
                        {/* Prev label — landscape only */}
                        <div className="hidden h-7 landscape:block lg:h-8">{prevLabel}</div>
                        {current.chordProgression && (
                          <p className="mt-5 font-mono text-lg opacity-60 lg:mt-7 lg:text-xl landscape:mt-4 landscape:text-2xl landscape:lg:mt-6 landscape:lg:text-3xl">
                            {current.chordProgression}
                          </p>
                        )}
                        {current.memo && (
                          <p className="mt-2 text-sm opacity-30 lg:text-base landscape:mt-3">{current.memo}</p>
                        )}
                        {/* Next hint — landscape only */}
                        <div className="hidden h-10 landscape:mt-4 landscape:block landscape:lg:mt-6">{nextHint}</div>
                      </div>
                    )}
                  </div>

                  {/* Next section hint or paused hint — hidden in landscape when details column hosts it */}
                  <div className={`mt-6 h-10 text-center lg:mt-8${hasDetails ? " landscape:hidden" : ""}`}>
                    {nextHint}
                  </div>
                </>
              ) : null}
            </button>
          )}

          {/* ── Bottom controls ─────────────────────── */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 pb-4 pt-2 lg:px-8">
              <button
                type="button"
                onClick={handleBack}
                aria-disabled={currentIndex === 0}
                className={`min-w-[72px] rounded-full px-4 py-2 text-sm transition-opacity active:opacity-80 ${
                  currentIndex === 0 ? "opacity-20" : "opacity-50"
                }`}
              >
                {t.common.back}
              </button>
              <span className="font-mono text-xs opacity-30">
                {isEnded ? t.common.end : `${currentIndex + 1}${t.perform.of}${total}`}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="min-w-[72px] rounded-full px-4 py-2 text-sm opacity-50 transition-opacity active:opacity-80"
              >
                {t.common.reset}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// `key={currentBeat}` remounts the span so the CSS animation restarts on each
// beat, keeping the pulse aligned with the click audio.
function BeatStrip({ currentBeat, bpm }: { currentBeat: number; bpm: number | null }) {
  const isActive = currentBeat >= 0 && bpm !== null;
  const color = SECTION_COLORS.solo;
  return (
    <span
      key={isActive ? currentBeat : "idle"}
      aria-hidden="true"
      className="block h-3 w-3 rounded-full lg:h-3.5 lg:w-3.5"
      style={{
        backgroundColor: color,
        opacity: isActive ? undefined : 0.2,
        animation: isActive ? `led-pulse ${msPerBeat(bpm)}ms ease-out forwards` : undefined,
        boxShadow: `0 0 12px ${color}`,
      }}
    />
  );
}

function BarDots({ total, currentBar, color }: { total: number; currentBar: number; color: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 lg:mt-4 lg:gap-2" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, never reordered
          key={i}
          className="h-2 w-2 rounded-full transition-opacity duration-150 lg:h-2.5 lg:w-2.5"
          style={{
            backgroundColor: color,
            opacity: i < currentBar ? 0.9 : 0.2,
          }}
        />
      ))}
    </div>
  );
}
