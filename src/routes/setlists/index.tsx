import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Calendar, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { deleteSetlist, listSetlists, type SetlistWithSongCount } from "@/setlists/server-fns";

export const Route = createFileRoute("/setlists/")({
  beforeLoad: requireAuth,
  loader: () => listSetlists({ data: {} }),
  component: SetlistsPage,
});

function SetlistsPage() {
  const initial = Route.useLoaderData();
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [setlists, setSetlists] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(t.setlist.confirmDelete)) return;
    setDeletingId(id);
    try {
      await deleteSetlist({ data: { id } });
      const refreshed = await listSetlists({ data: {} });
      setSetlists(refreshed.items);
      setHasMore(refreshed.hasMore);
      router.invalidate();
    } catch (error) {
      clientLogger.error("deleteSetlist", error);
      toast.error(t.common.errorDeleteFailed);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const next = await listSetlists({ data: { offset: setlists.length } });
      setSetlists((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    } catch (error) {
      clientLogger.error("loadMoreSetlists", error);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.nav.setlists}</h1>
        <Link
          to="/setlists/new"
          className="flex items-center gap-1 rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-white transition-opacity active:opacity-70"
        >
          <Plus size={16} />
          {t.setlist.newSetlist}
        </Link>
      </div>

      {setlists.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-text-secondary">{t.setlist.noSetlists}</p>
          <Link
            to="/setlists/new"
            className="mt-4 inline-block rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-white"
          >
            {t.setlist.newSetlist}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {setlists.map((setlist: SetlistWithSongCount) => (
              <div key={setlist.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Link to="/setlists/$id" params={{ id: setlist.id }} className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{setlist.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-secondary">
                      <span>{t.setlist.songCount.replace("{count}", String(setlist.songCount))}</span>
                      {setlist.venue && (
                        <span className="flex items-center gap-0.5">
                          <MapPin size={12} />
                          {setlist.venue}
                        </span>
                      )}
                      {setlist.sessionDate && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={12} />
                          {setlist.sessionDate}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(setlist.id)}
                    disabled={deletingId === setlist.id}
                    aria-label={t.common.delete}
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
