import { createFileRoute, Link, useLoaderData, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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

  const [songs, setSongs] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  useEffect(() => {
    setSongs(initial.items);
    setHasMore(initial.hasMore);
  }, [initial]);

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    navigate({ to: "/songs", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, search.q, navigate]);

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
      setSongs((prev) => prev.filter((item) => item.song.id !== id));
      router.invalidate();
    } catch (error) {
      clientLogger.error("deleteSong", error);
      toast.error(t.common.errorDeleteFailed);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const next = await listSongs({ data: { offset: songs.length, query: search.q } });
      setSongs((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    } catch (error) {
      clientLogger.error("loadMoreSongs", error);
      toast.error(t.common.errorLoadFailed);
    } finally {
      setLoadingMore(false);
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
          <MetaTag>{songs.length === 0 ? (isSearching ? "NO MATCHES" : "NO SONGS") : "SELECT A SONG"}</MetaTag>
          {songs.length === 0 && (
            <p style={{ color: "var(--color-dim)", fontSize: 14, maxWidth: 320 }}>
              {isSearching ? t.song.searchNoResults : t.song.noSongs}
            </p>
          )}
          {!isSearching && (
            <div className="mt-2">
              <ConsoleBtn tone="accent" onClick={handleCreate}>
                <IconPlus size={10} />
                NEW SONG
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
                color: "#fff",
              }}
            >
              {t.nav.songs}
            </h1>
            <div className="mt-1.5">
              <MetaTag>
                {String(songs.length).padStart(2, "0")} {isSearching ? "SHOWN" : "TOTAL"}
              </MetaTag>
            </div>
          </div>
          <ConsoleBtn tone="white" onClick={handleCreate}>
            <IconPlus size={10} />
            NEW
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
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.song.searchPlaceholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
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
            <MetaTag>{isSearching ? "NO MATCHES" : "NO SONGS"}</MetaTag>
            <p style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {isSearching ? t.song.searchNoResults : t.song.noSongs}
            </p>
            {!isSearching && (
              <div className="mt-2">
                <ConsoleBtn tone="accent" onClick={handleCreate}>
                  <IconPlus size={10} />
                  NEW SONG
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
        <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
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
