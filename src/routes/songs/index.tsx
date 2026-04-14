import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { StructurePreview } from "@/songs/components/StructurePreview";
import { deleteSong, listSongs, type SectionRow, type SongRow } from "@/songs/server-fns";

export const Route = createFileRoute("/songs/")({
  beforeLoad: requireAuth,
  loader: () => listSongs({ data: {} }),
  component: SongsPage,
});

function SongsPage() {
  const initial = Route.useLoaderData();
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [songs, setSongs] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const next = await listSongs({ data: { offset: songs.length } });
      setSongs((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    } catch (error) {
      clientLogger.error("loadMoreSongs", error);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.nav.songs}</h1>
        <Link
          to="/songs/new"
          className="flex items-center gap-1 rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-white transition-opacity active:opacity-70"
        >
          <Plus size={16} />
          {t.nav.newSong}
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-text-secondary">{t.song.noSongs}</p>
          <Link
            to="/songs/new"
            className="mt-4 inline-block rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-white"
          >
            {t.nav.newSong}
          </Link>
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
