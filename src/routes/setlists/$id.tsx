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
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconDrag, IconPlay, IconPlus, IconSearch, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

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

  const [title, setTitle] = useState(data.setlist.title);
  const [description, setDescription] = useState(data.setlist.description ?? "");
  const [sessionDate, setSessionDate] = useState(data.setlist.sessionDate ?? "");
  const [venue, setVenue] = useState(data.setlist.venue ?? "");
  const [titleError, setTitleError] = useState(false);

  const [songs, setSongs] = useState<SetlistSongItem[]>(data.songs);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pickerInput, setPickerInput] = useState("");
  const debouncedPickerInput = useDebouncedValue(pickerInput, 300);
  const [availableSongs, setAvailableSongs] = useState<PickerSong[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const latestPickerQueryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    const query = debouncedPickerInput.trim() || undefined;
    latestPickerQueryRef.current = query;
    setPickerLoading(true);
    listSongsForPicker({ data: { setlistId, query } })
      .then((result) => {
        if (latestPickerQueryRef.current !== query) return;
        setAvailableSongs(result);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
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
      router.invalidate();
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="grid items-center gap-3"
        style={{
          gridTemplateColumns: "auto 1fr auto",
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <Link to="/setlists" aria-label={t.common.back} style={{ color: "#fff", padding: 6 }}>
          <IconBack size={20} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div
            className="truncate"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {title.trim() || data.setlist.title}
          </div>
          <div style={{ marginTop: 3 }}>
            <MetaTag size={9}>{String(songs.length).padStart(2, "0")} SONGS</MetaTag>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {songs.length > 0 && (
            <Link
              to="/songs/$id/perform"
              params={{ id: songs[0].songId }}
              search={{ setlistId }}
              aria-label="Perform"
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent)",
                borderRadius: 2,
              }}
            >
              <IconPlay size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t.common.delete}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-section-solo)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-36 pt-6 lg:px-10">
        <section className="grid gap-4">
          <MetaTag>01 · SETLIST META</MetaTag>
          <ConsoleField
            label={t.setlist.title}
            value={title}
            onChange={(v) => {
              setTitle(v);
              if (titleError) setTitleError(false);
            }}
            required
          />
          {titleError && (
            <p
              style={{
                fontSize: 12,
                color: "var(--color-section-solo)",
                marginTop: -8,
              }}
            >
              {t.setlist.titleRequired}
            </p>
          )}

          <label style={{ display: "block" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.25em",
                color: "var(--color-dim-2)",
                marginBottom: 8,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {t.setlist.description}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--color-line)",
                borderLeft: description ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
                padding: "12px 14px",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: description ? "#fff" : "rgba(255,255,255,0.3)",
                outline: "none",
                borderRadius: 0,
                resize: "vertical",
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <ConsoleField
              label={t.setlist.sessionDate}
              value={sessionDate}
              onChange={setSessionDate}
              type="date"
              mono
            />
            <ConsoleField label={t.setlist.venue} value={venue} onChange={setVenue} />
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between pb-4">
            <MetaTag>02 · SONGS · {String(songs.length).padStart(2, "0")} TOTAL</MetaTag>
          </div>

          {songs.length === 0 ? (
            <div
              className="py-12 text-center"
              style={{
                border: "1px dashed var(--color-line-2)",
                color: "var(--color-dim)",
                fontSize: 14,
              }}
            >
              {t.setlist.noSongs}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={songs.map((s) => s.songId)} strategy={verticalListSortingStrategy}>
                <ul style={{ borderTop: "1px solid var(--color-line)" }}>
                  {songs.map((song, index) => (
                    <SortableSongRow
                      key={song.songId}
                      song={song}
                      index={index}
                      onRemove={() => handleRemoveSong(song.songId)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="mt-4 flex w-full items-center justify-center gap-2"
            style={{
              padding: "14px",
              border: "1px dashed var(--color-line-2)",
              background: "transparent",
              color: "var(--color-dim)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <IconPlus size={10} />
            ADD SONG FROM LIBRARY
          </button>
        </section>
      </div>

      <div
        className="fixed right-0 left-0 z-40"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
          background: "var(--color-ink)",
          borderTop: "1px solid var(--color-line)",
          padding: "12px 20px",
        }}
      >
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              background: "#fff",
              color: "#111",
              border: "none",
              borderRadius: 2,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
            }}
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

function SortableSongRow({ song, index, onRemove }: { song: SetlistSongItem; index: number; onRemove: () => void }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="grid items-center gap-3">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "24px 36px 1fr 32px",
          alignItems: "center",
          gap: 10,
          padding: "14px 4px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reorder"
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-dim-2)",
            background: "transparent",
            border: "none",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <IconDrag size={14} />
        </button>
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
        <div className="min-w-0">
          <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
            {song.title}
          </div>
          {song.artist && (
            <div
              className="truncate"
              style={{
                marginTop: 3,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--color-dim-2)",
                textTransform: "uppercase",
              }}
            >
              {song.artist}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.setlist.removeSong}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-dim-2)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <IconTrash size={14} />
        </button>
      </div>
    </li>
  );
}

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
      <button
        type="button"
        aria-label={t.common.cancel}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.setlist.addSong}
        className="relative z-10 w-full max-w-md"
        style={{
          background: "var(--color-ink-2)",
          border: "1px solid var(--color-line)",
          color: "var(--color-text)",
          paddingBottom: 20,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{t.setlist.addSong}</div>
          </div>
          <ConsoleBtn onClick={onClose}>CLOSE</ConsoleBtn>
        </div>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--color-line)",
              padding: "10px 12px",
            }}
          >
            <IconSearch size={14} />
            <input
              type="search"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
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
                onClick={() => onInputChange("")}
                aria-label={t.song.searchClear}
                style={{
                  color: "var(--color-dim-2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto" style={{ padding: "12px 18px" }}>
          {loading ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.common.loading}
            </p>
          ) : availableSongs.length === 0 ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {emptyMessage}
            </p>
          ) : (
            <ul style={{ borderTop: "1px solid var(--color-line)" }}>
              {availableSongs.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(song)}
                    disabled={addingId === song.id}
                    className="flex w-full items-center gap-3 text-left"
                    style={{
                      padding: "14px 4px",
                      borderBottom: "1px solid var(--color-line)",
                      background: "transparent",
                      border: "none",
                      borderBottomStyle: "solid",
                      color: "var(--color-text)",
                      cursor: addingId === song.id ? "not-allowed" : "pointer",
                      opacity: addingId === song.id ? 0.5 : 1,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {song.title}
                      </div>
                      {song.artist && (
                        <div
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: "0.18em",
                            color: "var(--color-dim-2)",
                            textTransform: "uppercase",
                            marginTop: 3,
                          }}
                        >
                          {song.artist}
                        </div>
                      )}
                    </div>
                    <IconPlus size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
