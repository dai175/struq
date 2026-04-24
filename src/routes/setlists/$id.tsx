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
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { createSetlistWithSongsInputSchema, saveSetlistWithSongsInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { SetlistSongItem } from "@/setlists/server-fns";
import {
  createSetlistWithSongs,
  deleteSetlist,
  getSetlist,
  listSongsForPicker,
  saveSetlistWithSongs,
} from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconDrag, IconPlay, IconPlus, IconSearch, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { TopBar } from "@/ui/top-bar";

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
  return <SetlistEditor key={id} mode="edit" setlistId={id} data={data} />;
}

type PickerSong = { id: string; title: string; artist: string | null };

export type SetlistEditorProps =
  | { mode: "new" }
  | { mode: "edit"; setlistId: string; data: NonNullable<Awaited<ReturnType<typeof getSetlist>>> };

const EMPTY_SETLIST_DATA: NonNullable<Awaited<ReturnType<typeof getSetlist>>> = {
  setlist: {
    id: "",
    title: "",
    description: null,
    sessionDate: null,
    venue: null,
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
  },
  songs: [],
};

export function SetlistEditor(props: SetlistEditorProps) {
  const isNew = props.mode === "new";
  const data = props.mode === "edit" ? props.data : EMPTY_SETLIST_DATA;
  const editSetlistId = props.mode === "edit" ? props.setlistId : null;

  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const latestPickerQueryRef = useRef<string | undefined>(undefined);

  // Server-side NOT IN can't see local-only edits; also dedupe client-side.
  const pickerAvailableSongs = useMemo(() => {
    const existingIds = new Set(songs.map((s) => s.songId));
    return availableSongs.filter((s) => !existingIds.has(s.id));
  }, [availableSongs, songs]);

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
    listSongsForPicker({ data: { setlistId: editSetlistId ?? undefined, query } })
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
  }, [showPicker, editSetlistId, debouncedPickerInput, t.common.errorLoadFailed, toast.error]);

  const handlePickerAdd = useCallback((song: PickerSong) => {
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
    const basePayload = {
      title: trimmed,
      description: description.trim() || undefined,
      sessionDate: sessionDate || undefined,
      venue: venue.trim() || undefined,
      songIds: songs.map((s) => s.songId),
    };

    if (isNew) {
      const parsed = createSetlistWithSongsInputSchema.safeParse(basePayload);
      if (!parsed.success) {
        const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "title");
        if (hasTitleIssue) setTitleError(true);
        else toast.error(t.common.errorCreateFailed);
        return;
      }
      setSaving(true);
      try {
        const result = await createSetlistWithSongs({ data: parsed.data });
        navigate({ to: "/setlists/$id", params: { id: result.id }, replace: true });
      } catch (error) {
        clientLogger.error("createSetlist", error);
        toast.error(t.common.errorCreateFailed);
        setSaving(false);
      }
      return;
    }

    const parsed = saveSetlistWithSongsInputSchema.safeParse({
      id: editSetlistId ?? "",
      ...basePayload,
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
    if (!editSetlistId) return;
    setShowDeleteConfirm(false);
    try {
      await deleteSetlist({ data: { id: editSetlistId } });
      navigate({ to: "/setlists" });
    } catch (error) {
      clientLogger.error("deleteSetlist", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }

  function handleRemoveSong(songId: string) {
    setSongs((prev) => prev.filter((s) => s.songId !== songId));
  }

  const fallbackTitle = isNew ? t.setlist.newSetlist : data.setlist.title;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <PcDetailPane
        title={title}
        fallbackTitle={fallbackTitle}
        description={description}
        sessionDate={sessionDate}
        venue={venue}
        titleError={titleError}
        songs={songs}
        saving={saving}
        saved={saved}
        setlistId={editSetlistId}
        isNew={isNew}
        onTitleChange={(v) => {
          setTitle(v);
          if (titleError) setTitleError(false);
        }}
        onDescriptionChange={setDescription}
        onSessionDateChange={setSessionDate}
        onVenueChange={setVenue}
        onSave={handleSave}
        onDelete={() => setShowDeleteConfirm(true)}
        onDragEnd={handleDragEnd}
        onRemoveSong={handleRemoveSong}
        onOpenPicker={() => setShowPicker(true)}
      />

      <TopBar
        left={
          <Link to="/setlists" aria-label={t.common.back} style={{ color: "#fff", padding: 6 }}>
            <IconBack size={20} />
          </Link>
        }
        title={title.trim() || fallbackTitle}
        subtitle={<MetaTag size={9}>{String(songs.length).padStart(2, "0")} SONGS</MetaTag>}
        right={
          <>
            {!isNew && editSetlistId && songs.length > 0 && (
              <Link
                to="/songs/$id/perform"
                params={{ id: songs[0].songId }}
                search={{ setlistId: editSetlistId }}
                aria-label={t.perform.start}
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
            {!isNew && (
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
            )}
          </>
        }
      />

      <div className="mx-auto max-w-2xl px-5 pb-36 pt-6 lg:hidden">
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
            {t.setlist.addFromLibrary}
          </button>
        </section>
      </div>

      <div
        className="fixed right-0 left-0 z-40 lg:hidden"
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
        availableSongs={pickerAvailableSongs}
        loading={pickerLoading}
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
  setlistHasSongs,
  onAdd,
  onClose,
}: {
  open: boolean;
  input: string;
  onInputChange: (value: string) => void;
  availableSongs: PickerSong[];
  loading: boolean;
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
          <ConsoleBtn onClick={onClose}>{t.common.close.toUpperCase()}</ConsoleBtn>
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
              type="text"
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
                    className="flex w-full items-center gap-3 text-left"
                    style={{
                      padding: "14px 4px",
                      borderBottom: "1px solid var(--color-line)",
                      background: "transparent",
                      border: "none",
                      borderBottomStyle: "solid",
                      color: "var(--color-text)",
                      cursor: "pointer",
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

// ───── PC detail pane ─────────────────────────────────────────────────

function PcDetailPane({
  title,
  fallbackTitle,
  description,
  sessionDate,
  venue,
  titleError,
  songs,
  saving,
  saved,
  setlistId,
  isNew,
  onTitleChange,
  onDescriptionChange,
  onSessionDateChange,
  onVenueChange,
  onSave,
  onDelete,
  onDragEnd,
  onRemoveSong,
  onOpenPicker,
}: {
  title: string;
  fallbackTitle: string;
  description: string;
  sessionDate: string;
  venue: string;
  titleError: boolean;
  songs: SetlistSongItem[];
  saving: boolean;
  saved: boolean;
  setlistId: string | null;
  isNew: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSessionDateChange: (v: string) => void;
  onVenueChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onRemoveSong: (songId: string) => void;
  onOpenPicker: () => void;
}) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
  const subtitle = [sessionDate, venue].filter(Boolean).join(" · ");

  return (
    <div
      className="hidden min-h-screen lg:block"
      style={{ background: "var(--color-ink)", color: "var(--color-text)" }}
    >
      {/* TopRail */}
      <div
        className="flex items-center gap-4"
        style={{
          padding: "14px 28px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="truncate"
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
            }}
          >
            {title.trim() || fallbackTitle}
          </div>
          {subtitle && (
            <div style={{ marginTop: 3 }}>
              <MetaTag size={10}>{subtitle}</MetaTag>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <ConsoleBtn disabled title={t.common.comingSoon}>
              {t.common.duplicate.toUpperCase()}
            </ConsoleBtn>
          )}
          {!isNew && (
            <ConsoleBtn tone="coral" onClick={onDelete}>
              <IconTrash size={14} />
              {t.common.delete.toUpperCase()}
            </ConsoleBtn>
          )}
          <ConsoleBtn tone="white" onClick={onSave} disabled={saving}>
            {saving
              ? t.common.loading
              : saved
                ? t.setlist.saved
                : isNew
                  ? t.setlist.createSetlist.toUpperCase()
                  : t.common.saveChanges.toUpperCase()}
          </ConsoleBtn>
          {!isNew && setlistId && songs.length > 0 ? (
            <Link
              to="/songs/$id/perform"
              params={{ id: songs[0].songId }}
              search={{ setlistId }}
              style={{
                background: "var(--color-accent)",
                color: "#111",
                padding: "9px 14px",
                borderRadius: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                lineHeight: 1,
                border: "1px solid var(--color-accent)",
                textDecoration: "none",
              }}
            >
              <IconPlay size={12} />
              {t.perform.start.toUpperCase()}
            </Link>
          ) : (
            <ConsoleBtn tone="accent" disabled>
              <IconPlay size={12} />
              {t.perform.start.toUpperCase()}
            </ConsoleBtn>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px 48px" }}>
        {/* 01 SETLIST META */}
        <section>
          <MetaTag>01 · SETLIST META</MetaTag>
          <div className="grid grid-cols-2 gap-3" style={{ marginTop: 14 }}>
            <div className="col-span-2">
              <ConsoleField label={t.setlist.title} value={title} onChange={onTitleChange} required />
              {titleError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-section-solo)",
                    marginTop: 6,
                  }}
                >
                  {t.setlist.titleRequired}
                </p>
              )}
            </div>
            <div className="col-span-2">
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
                  onChange={(e) => onDescriptionChange(e.target.value)}
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
            </div>
            <ConsoleField
              label={t.setlist.sessionDate}
              value={sessionDate}
              onChange={onSessionDateChange}
              type="date"
              mono
            />
            <ConsoleField label={t.setlist.venue} value={venue} onChange={onVenueChange} />
          </div>
        </section>

        {/* 02 OVERVIEW */}
        <section style={{ marginTop: 32 }}>
          <MetaTag>02 · OVERVIEW</MetaTag>
          <div style={{ marginTop: 14 }}>
            <OverviewStat label="SONGS" value={String(songs.length).padStart(2, "0")} />
          </div>
        </section>

        {/* 03 SONGS */}
        <section style={{ marginTop: 32 }}>
          <div className="flex items-center" style={{ marginBottom: 14, gap: 10 }}>
            <MetaTag>03 · SONGS · {String(songs.length).padStart(2, "0")} TOTAL</MetaTag>
            <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
          </div>

          {songs.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                border: "1px dashed var(--color-line-2)",
                color: "var(--color-dim)",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {t.setlist.noSongs}
            </div>
          ) : (
            <>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "28px 42px 1fr 100px",
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--color-line)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--color-dim-2)",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div />
                <div>#</div>
                <div>TITLE</div>
                <div />
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={songs.map((s) => s.songId)} strategy={verticalListSortingStrategy}>
                  {songs.map((song, i) => (
                    <PcSortableSongRow
                      key={song.songId}
                      song={song}
                      index={i}
                      onRemove={() => onRemoveSong(song.songId)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}

          <button
            type="button"
            onClick={onOpenPicker}
            className="flex w-full items-center justify-center gap-2"
            style={{
              marginTop: 16,
              padding: "14px",
              border: "1px dashed var(--color-line-2)",
              background: "transparent",
              color: "var(--color-dim)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: 1,
            }}
          >
            <IconPlus size={10} />
            {t.setlist.addFromLibrary}
          </button>
        </section>
      </div>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <MetaTag>{label}</MetaTag>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginTop: 6,
          letterSpacing: "-0.02em",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PcSortableSongRow({ song, index, onRemove }: { song: SetlistSongItem; index: number; onRemove: () => void }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.songId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "grid",
        gridTemplateColumns: "28px 42px 1fr 100px",
        padding: "14px 4px",
        borderBottom: "1px solid var(--color-line)",
        alignItems: "center",
        gap: 10,
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
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "0.05em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
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
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--color-dim)",
              textTransform: "uppercase",
            }}
          >
            {song.artist}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.setlist.removeSong}
          style={{
            width: 28,
            height: 28,
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
    </div>
  );
}
