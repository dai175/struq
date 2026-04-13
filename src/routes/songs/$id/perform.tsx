import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { getSectionLabel, useI18n } from "@/i18n";
import type { Locale, Translations } from "@/i18n/types";
import { getSetlist, type SetlistSongItem } from "@/setlists/server-fns";
import { SECTION_COLORS } from "@/songs/constants";
import { getSongWithSections, type SectionRow, type SongRow } from "@/songs/server-fns";

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

  // currentIndex === total means END state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  // Setlist context
  const setlistSongs = setlistData?.songs ?? [];
  const currentSongIdx = setlistSongs.findIndex((s) => s.songId === songId);
  const isSetlistMode = !!setlistId && currentSongIdx >= 0;
  const hasNextSong = isSetlistMode && currentSongIdx < setlistSongs.length - 1;
  const hasPrevSong = isSetlistMode && currentSongIdx > 0;

  // Derived section state
  const total = sections.length;
  const isEnded = currentIndex >= total;
  const current = !isEnded ? sections[currentIndex] : undefined;
  const prev = currentIndex > 0 && currentIndex <= total ? sections[currentIndex - 1] : null;
  const next = currentIndex < total - 1 ? sections[currentIndex + 1] : null;

  // ── Handlers ──────────────────────────────────

  function handleAdvance() {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    if (total === 0 || isEnded) return;

    if (currentIndex >= total - 1) {
      if (isSetlistMode && hasNextSong) {
        const nextSong = setlistSongs[currentSongIdx + 1];
        navigate({
          to: "/songs/$id/perform",
          params: { id: nextSong.songId },
          search: { setlistId },
        });
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
  }

  function handleReset() {
    setCurrentIndex(0);
  }

  function goExit() {
    if (setlistId) {
      navigate({ to: "/setlists/$id", params: { id: setlistId } });
    } else {
      navigate({ to: "/songs/$id", params: { id: songId } });
    }
  }

  function navigateToSong(target: SetlistSongItem) {
    navigate({
      to: "/songs/$id/perform",
      params: { id: target.songId },
      search: { setlistId },
    });
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

  const handlersRef = useRef({ handleAdvance, handleBack, handleReset, goExit });
  handlersRef.current = { handleAdvance, handleBack, handleReset, goExit };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case " ":
        case "ArrowRight":
          e.preventDefault();
          handlersRef.current.handleAdvance();
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
      <div
        className="flex flex-1 cursor-pointer flex-col items-center justify-center px-6 lg:px-12"
        role="button"
        tabIndex={0}
        onClick={handleAdvance}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdvance();
          }
        }}
      >
        {total === 0 ? (
          <div className="text-center">
            <p className="text-lg opacity-40">{t.song.noSections}</p>
            <Link
              to="/songs/$id"
              params={{ id: songId }}
              className="mt-4 inline-block text-sm opacity-50 underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t.common.back}
            </Link>
          </div>
        ) : isEnded ? (
          <p className="text-6xl font-bold opacity-50 lg:text-8xl">{t.common.end}</p>
        ) : current ? (
          <>
            {/* Previous section */}
            <div className="mb-6 h-7 lg:mb-8 lg:h-8">
              {prev && <p className="text-base opacity-25 lg:text-xl">{sectionLabel(prev, locale)}</p>}
            </div>

            {/* Current section */}
            <div className="text-center">
              <p className="text-5xl font-bold lg:text-7xl" style={{ color: SECTION_COLORS[current.type] }}>
                {sectionLabel(current, locale)}
              </p>
              {current.chordProgression && (
                <p className="mt-4 font-mono text-xl opacity-80 lg:mt-6 lg:text-2xl">{current.chordProgression}</p>
              )}
              <p className="mt-3 font-mono text-base opacity-40 lg:text-lg">{formatBars(current, t)}</p>
              {current.memo && <p className="mt-2 text-sm opacity-30 lg:text-base">{current.memo}</p>}
            </div>

            {/* Next section hint */}
            <div className="mt-6 h-10 text-center lg:mt-8">
              {next ? (
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
              )}
            </div>
          </>
        ) : null}
      </div>

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
    </div>
  );
}
