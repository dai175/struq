import { createFileRoute, Link, useLoaderData, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLoadMore } from "@/lib/use-load-more";
import { deleteSong, listSongs, type SectionRow, type SongRow } from "@/songs/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconPlus, IconSearch, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

export const Route = createFileRoute("/songs/")({
  component: SongsPage,
});

function SongsPage() {
  const initial = useLoaderData({ from: "/songs" });
  const search = useSearch({ from: "/songs" });
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  // When the URL query changes (e.g. another search input — PC sidebar and
  // mobile header both mount simultaneously), sync local state synchronously
  // during render. A useEffect-based sync would leave `input` stale during
  // the same render's navigate effect, triggering a revert-navigate loop.
  const queryKey = search.q ?? "";
  const [boundKey, setBoundKey] = useState(queryKey);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  if (boundKey !== queryKey) {
    setBoundKey(queryKey);
    setInput(queryKey);
    setDeletedIds(new Set());
  }

  const {
    items: fetched,
    hasMore,
    loading: loadingMore,
    loadMore,
  } = useLoadMore({
    initialItems: initial.items,
    initialHasMore: initial.hasMore,
    resetKey: queryKey,
    fetchMore: (offset) => listSongs({ data: { offset, query: search.q } }),
  });

  const songs = useMemo(
    () => (deletedIds.size > 0 ? fetched.filter((it) => !deletedIds.has(it.song.id)) : fetched),
    [fetched, deletedIds],
  );

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

  async function executeDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      await deleteSong({ data: { id } });
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      router.invalidate();
    } catch (error) {
      clientLogger.error("deleteSong", error);
      toast.error(t.common.errorDeleteFailed);
    } finally {
      setDeletingId(null);
    }
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
        className="mx-auto min-h-screen max-w-2xl px-5 pt-6 pb-8 lg:hidden"
        style={{
          background: "var(--color-ink)",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <header className="flex items-end justify-between gap-3 pb-5">
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--color-text)",
              }}
            >
              {t.nav.songs}
            </h1>
            <div className="mt-1.5">
              <MetaTag>
                {String(songs.length).padStart(2, "0")} {isSearching ? t.song.shown : t.song.total}
              </MetaTag>
            </div>
          </div>
          <ConsoleBtn tone="white" onClick={handleCreate}>
            <IconPlus size={10} />
            {t.common.new.toUpperCase()}
          </ConsoleBtn>
        </header>

        <div
          className="flex items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--color-line)",
            padding: "10px 12px",
            marginBottom: 20,
          }}
        >
          <IconSearch size={14} />
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
        </div>

        {songs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-3">
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
              {songs.map(({ song, sections }: { song: SongRow; sections: SectionRow[] }, index: number) => (
                <SongRowView
                  key={song.id}
                  song={song}
                  sections={sections}
                  index={index}
                  deleting={deletingId === song.id}
                  onDelete={() => setPendingDeleteId(song.id)}
                />
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

      <ConfirmModal
        open={pendingDeleteId !== null}
        message={t.song.confirmDelete}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={executeDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}

function SongRowView({
  song,
  sections,
  index,
  deleting,
  onDelete,
}: {
  song: SongRow;
  sections: SectionRow[];
  index: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 32px",
        alignItems: "center",
        gap: 12,
        padding: "16px 4px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-dim-2)",
          letterSpacing: "0.08em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link to="/songs/$id" params={{ id: song.id }} className="min-w-0">
        <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
          {song.title}
        </p>
        {song.artist && (
          <div
            className="truncate mt-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--color-dim-2)",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {song.artist}
          </div>
        )}
        {sections.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <StructureBar sections={sections} height={3} gap={1} />
          </div>
        )}
        <div
          className="mt-2 flex"
          style={{
            gap: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--color-dim-2)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {song.bpm != null && <span>{song.bpm} BPM</span>}
          {song.key && <span>KEY {song.key}</span>}
          <span>
            {String(sections.length).padStart(2, "0")} SEC · {totalBars} BARS
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={t.song.deleteSong}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-dim-2)",
          background: "transparent",
          border: "none",
          cursor: deleting ? "not-allowed" : "pointer",
          opacity: deleting ? 0.4 : 1,
        }}
      >
        <IconTrash size={16} />
      </button>
    </li>
  );
}
