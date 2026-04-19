import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { StructurePreview } from "@/songs/components/StructurePreview";
import { deleteSong, listSongs, type SectionRow, type SongRow } from "@/songs/server-fns";

type SongsSearch = { q?: string };

export const Route = createFileRoute("/songs/")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): SongsSearch => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => listSongs({ data: { query: deps.q } }),
  component: SongsPage,
});

function SongsPage() {
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [songs, setSongs] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  useEffect(() => {
    setSongs(initial.items);
    setHasMore(initial.hasMore);
  }, [initial]);

  // `replace` keeps incremental keystrokes out of the back/forward stack.
  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    navigate({ to: "/songs", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, search.q, navigate]);

  async function handleDelete(id: string) {
    if (!confirm(t.song.confirmDelete)) return;
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
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.nav.songs}</h1>
        <Link
          to="/songs/new"
          className="flex items-center gap-1 rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-white transition-opacity active:opacity-70"
        >
          <Plus size={16} />
          {t.nav.newSong}
        </Link>
      </div>

      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.song.searchPlaceholder}
          className="w-full rounded-full bg-white py-2.5 pl-9 pr-9 text-sm shadow-sm outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-text-primary/10 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {input && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label={t.song.searchClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="py-20 text-center">
          {isSearching ? (
            <p className="text-text-secondary">{t.song.searchNoResults}</p>
          ) : (
            <>
              <p className="text-text-secondary">{t.song.noSongs}</p>
              <Link
                to="/songs/new"
                className="mt-4 inline-block rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-white"
              >
                {t.nav.newSong}
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {songs.map(({ song, sections }: { song: SongRow; sections: SectionRow[] }) => (
              <div key={song.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Link to="/songs/$id" params={{ id: song.id }} className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{song.title}</p>
                    {song.artist && <p className="mt-0.5 truncate text-sm text-text-secondary">{song.artist}</p>}
                    {sections.length > 0 && (
                      <div className="mt-2">
                        <StructurePreview sections={sections} />
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(song.id)}
                    disabled={deletingId === song.id}
                    aria-label={t.song.deleteSong}
                    className="shrink-0 p-2 text-text-secondary transition-colors hover:text-red-500 disabled:opacity-40"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-4 w-full py-3 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
            >
              {loadingMore ? t.common.loading : t.common.loadMore}
            </button>
          )}
        </>
      )}
    </div>
  );
}
