import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, GripVertical, Music, Play, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { saveSetlistWithSongsInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { SetlistSongItem } from "@/setlists/server-fns";
import {
  addSongToSetlist,
  deleteSetlist,
  getSetlist,
  listSongsForPicker,
  removeSongFromSetlist,
  saveSetlistWithSongs,
} from "@/setlists/server-fns";

export const Route = createFileRoute("/setlists/$id")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    const data = await getSetlist({ data: { setlistId: params.id } });
    if (!data) throw redirect({ to: "/setlists" });
    return data;
  },
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();

  return <SetlistEditor key={id} setlistId={id} data={data} />;
}

type PickerSong = { id: string; title: string; artist: string | null };

function SetlistEditor({
  setlistId,
  data,
}: {
  setlistId: string;
  data: NonNullable<Awaited<ReturnType<typeof getSetlist>>>;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const router = useRouter();

  // Metadata state
  const [title, setTitle] = useState(data.setlist.title);
  const [description, setDescription] = useState(data.setlist.description ?? "");
  const [sessionDate, setSessionDate] = useState(data.setlist.sessionDate ?? "");
  const [venue, setVenue] = useState(data.setlist.venue ?? "");
  const [titleError, setTitleError] = useState(false);

  // Song list state
  const [songs, setSongs] = useState<SetlistSongItem[]>(data.songs);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Song picker state (hoisted so it survives open/close cycles)
  const [pickerInput, setPickerInput] = useState("");
  const debouncedPickerInput = useDebouncedValue(pickerInput, 300);
  const [availableSongs, setAvailableSongs] = useState<{ id: string; title: string; artist: string | null }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const latestPickerQueryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  // Fetch picker candidates only while picker is open
  useEffect(() => {
    if (!showPicker) return;
    const query = debouncedPickerInput.trim() || undefined;
    latestPickerQueryRef.current = query;
    setPickerLoading(true);
    listSongsForPicker({ data: { setlistId, query } })
      .then((songs) => {
        if (latestPickerQueryRef.current !== query) return;
        setAvailableSongs(songs);
      })
      .catch((error) => {
        if (latestPickerQueryRef.current !== query) return;
        clientLogger.error("listSongsForPicker", error);
        setAvailableSongs([]);
        toast.error(t.common.errorLoadFailed);
      })
      .finally(() => {
        if (latestPickerQueryRef.current !== query) return;
        setPickerLoading(false);
      });
  }, [showPicker, setlistId, debouncedPickerInput, t.common.errorLoadFailed, toast.error]);

  async function handlePickerAdd(song: PickerSong) {
    setAddingId(song.id);
    try {
      await addSongToSetlist({ data: { setlistId, songId: song.id } });
      handleSongAdded(song);
      setAvailableSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch (error) {
      clientLogger.error("addSong", error);
      toast.error(t.common.errorAddFailed);
    } finally {
      setAddingId(null);
    }
  }

  function handlePickerClose() {
    setShowPicker(false);
    setPickerInput("");
  }

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
    const parsed = saveSetlistWithSongsInputSchema.safeParse({
      id: setlistId,
      title: trimmed,
      description: description.trim() || undefined,
      sessionDate: sessionDate || undefined,
      venue: venue.trim() || undefined,
      songIds: songs.map((s) => s.songId),
    });
    if (!parsed.success) {
      const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "title");
      if (hasTitleIssue) setTitleError(true);
      else toast.error(t.common.errorSaveFailed);
      return;
    }

    setSaving(true);
    try {
      await saveSetlistWithSongs({ data: parsed.data });
      setSaved(true);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      clientLogger.error("saveSetlistWithSongs", error);
      toast.error(t.common.errorSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function executeDelete() {
    setShowDeleteConfirm(false);
    try {
      await deleteSetlist({ data: { id: setlistId } });
      navigate({ to: "/setlists" });
    } catch (error) {
      clientLogger.error("deleteSetlist", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }

  async function handleRemoveSong(songId: string) {
    setSongs((prev) => prev.filter((s) => s.songId !== songId));
    try {
      await removeSongFromSetlist({ data: { setlistId, songId } });
    } catch (error) {
      clientLogger.error("removeSong", error);
      // Revert on error
      router.invalidate();
    }
  }

  const handleSongAdded = useCallback((song: PickerSong) => {
    setSongs((prev) => [
      ...prev,
      {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        sortOrder: prev.length,
      },
    ]);
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pb-36 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/setlists"
            aria-label={t.common.back}
            className="flex shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="truncate text-xl font-bold">{title.trim() || data.setlist.title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {songs.length > 0 && (
            <Link
              to="/songs/$id/perform"
              params={{ id: songs[0].songId }}
              search={{ setlistId }}
              className="rounded-full p-2 transition-colors hover:bg-surface-muted"
              aria-label="Perform"
            >
              <Play size={18} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t.common.delete}
            className="p-2 text-text-secondary transition-colors hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Metadata form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="setlist-title" className="mb-1 block text-sm text-text-secondary">
            {t.setlist.title} *
          </label>
          <input
            id="setlist-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            aria-describedby={titleError ? "setlist-title-error" : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              titleError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {titleError && (
            <p id="setlist-title-error" className="mt-1 text-xs text-red-500">
              {t.setlist.titleRequired}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="setlist-desc" className="mb-1 block text-sm text-text-secondary">
            {t.setlist.description}
          </label>
          <textarea
            id="setlist-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="setlist-date" className="mb-1 block text-sm text-text-secondary">
              {t.setlist.sessionDate}
            </label>
            <input
              id="setlist-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="setlist-venue" className="mb-1 block text-sm text-text-secondary">
              {t.setlist.venue}
            </label>
            <input
              id="setlist-venue"
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={songs.map((s) => s.songId)} strategy={verticalListSortingStrategy}>
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
            {saving ? t.common.loading : saved ? t.setlist.saved : t.common.save}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        message={t.setlist.confirmDelete}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Song picker modal */}
      <SongPickerModal
        open={showPicker}
        input={pickerInput}
        onInputChange={setPickerInput}
        availableSongs={availableSongs}
        loading={pickerLoading}
        addingId={addingId}
        setlistHasSongs={songs.length > 0}
        onAdd={handlePickerAdd}
        onClose={handlePickerClose}
      />
    </div>
  );
}

// ─── SortableSongCard ──────────────────────────────────

function SortableSongCard({ song, index, onRemove }: { song: SetlistSongItem; index: number; onRemove: () => void }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center text-text-secondary active:text-text-primary"
      >
        <GripVertical size={18} />
      </div>
      <span className="w-6 text-center text-xs font-mono text-text-secondary">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        {song.artist && <p className="truncate text-xs text-text-secondary">{song.artist}</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t.setlist.removeSong}
        className="shrink-0 p-1.5 text-text-secondary transition-colors hover:text-red-500"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── SongPickerModal ───────────────────────────────────

function SongPickerModal({
  open,
  input,
  onInputChange,
  availableSongs,
  loading,
  addingId,
  setlistHasSongs,
  onAdd,
  onClose,
}: {
  open: boolean;
  input: string;
  onInputChange: (value: string) => void;
  availableSongs: PickerSong[];
  loading: boolean;
  addingId: string | null;
  setlistHasSongs: boolean;
  onAdd: (song: PickerSong) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const emptyMessage = input.trim()
    ? t.song.searchNoResults
    : setlistHasSongs
      ? t.setlist.pickerAllAdded
      : t.song.noSongs;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={t.common.cancel} onClick={onClose} />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.setlist.addSong}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface pb-8"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">{t.setlist.addSong}</h2>
          <button type="button" onClick={onClose} aria-label={t.common.cancel} className="p-1 text-text-secondary">
            <X size={20} />
          </button>
        </div>
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="search"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={t.song.searchPlaceholder}
              className="w-full rounded-full bg-white py-2.5 pl-9 pr-9 text-sm shadow-sm outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-text-primary/10 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {input && (
              <button
                type="button"
                onClick={() => onInputChange("")}
                aria-label={t.song.searchClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-secondary transition-colors hover:text-text-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-secondary">{t.common.loading}</p>
          ) : availableSongs.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">{emptyMessage}</p>
          ) : (
            <div className="space-y-2">
              {availableSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => onAdd(song)}
                  disabled={addingId === song.id}
                  className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition-colors active:bg-gray-50 disabled:opacity-40"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                    <Music size={14} className="text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    {song.artist && <p className="truncate text-xs text-text-secondary">{song.artist}</p>}
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
