import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { listSongs, deleteSong } from "@/songs/server-fns";
import { StructurePreview } from "@/songs/components/StructurePreview";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/songs/")({
  beforeLoad: requireAuth,
  loader: () => listSongs(),
  component: SongsPage,
});

function SongsPage() {
  const songs = Route.useLoaderData();
  const { t } = useI18n();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(t.song.confirmDelete)) return;
    setDeletingId(id);
    try {
      await deleteSong({ data: { id } });
      router.invalidate();
    } catch {
      alert(t.common.error);
    } finally {
      setDeletingId(null);
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
        <div className="space-y-3">
          {songs.map(({ song, sections }) => (
            <div key={song.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Link
                  to="/songs/$id"
                  params={{ id: song.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-semibold">{song.title}</p>
                  {song.artist && (
                    <p className="mt-0.5 truncate text-sm text-text-secondary">
                      {song.artist}
                    </p>
                  )}
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
                  className="shrink-0 p-2 text-text-secondary transition-colors hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
