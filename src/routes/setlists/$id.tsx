import { useState, useEffect, useCallback, useRef } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import {
  getSetlist,
  updateSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
  reorderSetlistSongs,
  listSongsForPicker,
} from "@/setlists/server-fns";
import type { SetlistSongItem } from "@/setlists/server-fns";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  X,
  Plus,
  Trash2,
  Music,
} from "lucide-react";

export const Route = createFileRoute("/setlists/$id")({
  beforeLoad: requireAuth,
  loader: ({ params }) => getSetlist({ data: { setlistId: params.id } }),
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) navigate({ to: "/setlists" });
  }, [data, navigate]);

  if (!data) return null;

  return <SetlistEditor key={id} setlistId={id} data={data} />;
}

function SetlistEditor({
  setlistId,
  data,
}: {
  setlistId: string;
  data: NonNullable<Awaited<ReturnType<typeof getSetlist>>>;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();

  // Metadata state
  const [title, setTitle] = useState(data.setlist.title);
  const [description, setDescription] = useState(
    data.setlist.description ?? "",
  );
  const [sessionDate, setSessionDate] = useState(
    data.setlist.sessionDate ?? "",
  );
  const [venue, setVenue] = useState(data.setlist.venue ?? "");
  const [titleError, setTitleError] = useState(false);

  // Song list state
  const [songs, setSongs] = useState<SetlistSongItem[]>(data.songs);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  // Dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex((s) => s.songId === active.id);
    const newIndex = songs.findIndex((s) => s.songId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setSongs(arrayMove(songs, oldIndex, newIndex));
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        updateSetlist({
          data: {
            id: setlistId,
            title: trimmed,
            description: description.trim() || undefined,
            sessionDate: sessionDate || undefined,
            venue: venue.trim() || undefined,
          },
        }),
        reorderSetlistSongs({
          data: {
            setlistId,
            songIds: songs.map((s) => s.songId),
          },
        }),
      ]);
      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      alert(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t.setlist.confirmDelete)) return;
    try {
      await deleteSetlist({ data: { id: setlistId } });
      navigate({ to: "/setlists" });
    } catch {
      alert(t.common.error);
    }
  }

  async function handleRemoveSong(songId: string) {
    setSongs((prev) => prev.filter((s) => s.songId !== songId));
    try {
      await removeSongFromSetlist({ data: { setlistId, songId } });
    } catch {
      // Revert on error
      router.invalidate();
    }
  }

  const handleSongAdded = useCallback(
    (song: { id: string; title: string; artist: string | null }) => {
      setSongs((prev) => [
        ...prev,
        {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          sortOrder: prev.length,
        },
      ]);
    },
    [],
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-36 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/setlists"
            className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">{t.nav.setlists}</h1>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 text-text-secondary transition-colors hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Metadata form */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            {t.setlist.title} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              titleError
                ? "border-red-400 focus:border-red-500"
                : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-500">
              {t.setlist.titleRequired}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            {t.setlist.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">
              {t.setlist.sessionDate}
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">
              {t.setlist.venue}
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t.setlist.songCount.replace("{count}", String(songs.length))}
          </h2>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 rounded-full bg-text-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity active:opacity-70"
          >
            <Plus size={14} />
            {t.setlist.addSong}
          </button>
        </div>

        {songs.length === 0 ? (
          <div className="rounded-xl bg-white py-12 text-center shadow-sm">
            <p className="text-sm text-text-secondary">{t.setlist.noSongs}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={songs.map((s) => s.songId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <SortableSongCard
                    key={song.songId}
                    song={song}
                    index={index}
                    onRemove={() => handleRemoveSong(song.songId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-[72px] left-0 right-0 border-t border-gray-100 bg-surface px-4 py-3">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-text-primary py-3 text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
          >
            {saving
              ? t.common.loading
              : saved
                ? t.setlist.saved
                : t.common.save}
          </button>
        </div>
      </div>

      {/* Song picker modal */}
      {showPicker && (
        <SongPickerModal
          setlistId={setlistId}
          onAdd={handleSongAdded}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ─── SortableSongCard ──────────────────────────────────

function SortableSongCard({
  song,
  index,
  onRemove,
}: {
  song: SetlistSongItem;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center text-text-secondary active:text-text-primary"
      >
        <GripVertical size={18} />
      </div>
      <span className="w-6 text-center text-xs font-mono text-text-secondary">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        {song.artist && (
          <p className="truncate text-xs text-text-secondary">{song.artist}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-1.5 text-text-secondary transition-colors hover:text-red-500"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── SongPickerModal ───────────────────────────────────

function SongPickerModal({
  setlistId,
  onAdd,
  onClose,
}: {
  setlistId: string;
  onAdd: (song: { id: string; title: string; artist: string | null }) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [availableSongs, setAvailableSongs] = useState<
    { id: string; title: string; artist: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    listSongsForPicker({ data: { setlistId } })
      .then(setAvailableSongs)
      .catch(() => setAvailableSongs([]))
      .finally(() => setLoading(false));
  }, [setlistId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleAdd(song: {
    id: string;
    title: string;
    artist: string | null;
  }) {
    setAddingId(song.id);
    try {
      await addSongToSetlist({ data: { setlistId, songId: song.id } });
      onAdd(song);
      setAvailableSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch {
      alert(t.common.error);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface pb-8">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">{t.setlist.addSong}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-secondary">
              {t.common.loading}
            </p>
          ) : availableSongs.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">
              {t.song.noSongs}
            </p>
          ) : (
            <div className="space-y-2">
              {availableSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => handleAdd(song)}
                  disabled={addingId === song.id}
                  className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition-colors active:bg-gray-50 disabled:opacity-40"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                    <Music size={14} className="text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    {song.artist && (
                      <p className="truncate text-xs text-text-secondary">
                        {song.artist}
                      </p>
                    )}
                  </div>
                  <Plus size={18} className="shrink-0 text-text-secondary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
