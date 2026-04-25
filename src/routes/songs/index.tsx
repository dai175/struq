import { createFileRoute, Link, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLoadMore } from "@/lib/use-load-more";
import { listSongs, type SectionRow, type SongRow } from "@/songs/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconPlus, IconSearch, Logomark } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";
import { TopBar } from "@/ui/top-bar";

export const Route = createFileRoute("/songs/")({
  component: SongsPage,
});

function SongsPage() {
  const initial = useLoaderData({ from: "/songs" });
  const search = useSearch({ from: "/songs" });
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  // When the URL query changes (e.g. another search input — PC sidebar and
  // mobile header both mount simultaneously), sync local state synchronously
  // during render. A useEffect-based sync would leave `input` stale during
  // the same render's navigate effect, triggering a revert-navigate loop.
  const queryKey = search.q ?? "";
  const [boundKey, setBoundKey] = useState(queryKey);
  if (boundKey !== queryKey) {
    setBoundKey(queryKey);
    setInput(queryKey);
  }

  const {
    items: songs,
    hasMore,
    loading: loadingMore,
    loadMore,
  } = useLoadMore({
    initialItems: initial.items,
    initialHasMore: initial.hasMore,
    resetKey: queryKey,
    fetchMore: (offset) => listSongs({ data: { offset, query: search.q } }),
  });

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    // Skip while the debounce is still catching up to the latest input —
    // otherwise we'd navigate with a stale value (e.g. revert an in-flight
    // search just because our local debounce hasn't settled yet).
    if (input !== debouncedInput) return;
    navigate({ to: "/songs", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, input, search.q, navigate]);

  function handleCreate() {
    navigate({ to: "/songs/new" });
  }

  async function handleLoadMore() {
    try {
      await loadMore();
    } catch (error) {
      clientLogger.error("loadMoreSongs", error);
      toast.error(t.common.errorLoadFailed);
    }
  }

  function handleClearSearch() {
    setInput("");
    navigate({ to: "/songs", search: {}, replace: true });
  }

  const isSearching = !!search.q;

  return (
    <>
      {/* PC empty state — the library column lives in the layout (route.tsx);
          this pane fills the detail slot when no song is selected. */}
      <div className="hidden min-h-screen lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <MetaTag>{songs.length === 0 ? (isSearching ? t.song.noMatches : t.song.noSongs) : t.song.selectOne}</MetaTag>
          {songs.length === 0 && isSearching && (
            <p style={{ color: "var(--color-dim)", fontSize: 14, maxWidth: 320 }}>{t.song.searchNoResults}</p>
          )}
          {!isSearching && (
            <div className="mt-2">
              <ConsoleBtn tone="accent" onClick={handleCreate}>
                <IconPlus size={10} />
                {t.nav.newSong.toUpperCase()}
              </ConsoleBtn>
            </div>
          )}
        </div>
      </div>

      <div
        className="mx-auto min-h-screen max-w-2xl lg:hidden flex flex-col"
        style={{
          background: "var(--color-ink)",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <TopBar
          title={t.nav.songs}
          subtitle={`${String(songs.length).padStart(2, "0")} ${isSearching ? t.song.shown : t.song.total}`}
          left={<Logomark size={28} />}
          right={
            <ConsoleBtn tone="inverse" onClick={handleCreate}>
              <IconPlus size={10} />
              {t.common.new.toUpperCase()}
            </ConsoleBtn>
          }
        />

        <div
          className="flex items-center gap-3"
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <IconSearch size={14} style={{ color: "var(--color-dim)" }} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.song.searchPlaceholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
            }}
          />
          {input && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label={t.song.searchClear}
              style={{
                color: "var(--color-dim-2)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 2,
                fontSize: 16,
              }}
            >
              ×
            </button>
          )}
          <MetaTag>A–Z</MetaTag>
        </div>

        {songs.length === 0 ? (
          <div className="flex flex-col items-center py-20 px-5 text-center gap-3">
            <MetaTag>{isSearching ? t.song.noMatches : t.song.noSongs}</MetaTag>
            {isSearching && <p style={{ color: "var(--color-dim)", fontSize: 14 }}>{t.song.searchNoResults}</p>}
            {!isSearching && (
              <div className="mt-2">
                <ConsoleBtn tone="accent" onClick={handleCreate}>
                  <IconPlus size={10} />
                  {t.nav.newSong.toUpperCase()}
                </ConsoleBtn>
              </div>
            )}
          </div>
        ) : (
          <>
            <ul style={{ borderTop: "1px solid var(--color-line)" }}>
              {songs.map(({ song, sections }, index) => (
                <SongRowView key={song.id} song={song} sections={sections} index={index} />
              ))}
            </ul>
            {hasMore && (
              <div className="flex justify-center py-6">
                <ConsoleBtn onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? t.common.loading : t.common.loadMore}
                </ConsoleBtn>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function SongRowView({ song, sections, index }: { song: SongRow; sections: SectionRow[]; index: number }) {
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "22px 1fr",
        alignItems: "start",
        gap: 14,
        padding: "16px 18px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--color-dim-2)",
          letterSpacing: "0.18em",
          paddingTop: 4,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link to="/songs/$id" params={{ id: song.id }} className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="truncate" style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)" }}>
            {song.title}
          </span>
          {song.artist && (
            <span
              className="truncate"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
              }}
            >
              {song.artist}
            </span>
          )}
        </div>
        {sections.length > 0 && (
          <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
            <StructureBar sections={sections} height={5} gap={1.5} style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "var(--color-dim)",
                whiteSpace: "nowrap",
              }}
            >
              {String(sections.length).padStart(2, "0")} SEC
            </span>
          </div>
        )}
        <div
          className="flex"
          style={{
            gap: 14,
            marginTop: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--color-dim)",
            textTransform: "uppercase",
          }}
        >
          {song.bpm != null && <span>{song.bpm} BPM</span>}
          {song.key && <span>KEY {song.key}</span>}
          <span>{totalBars} BARS</span>
        </div>
      </Link>
    </li>
  );
}
