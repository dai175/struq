import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import { ConfirmModal } from "@/lib/confirm-modal";
import { UnsavedChangesGuardModal } from "@/lib/unsaved-changes-guard-modal";
import { useDndSensors } from "@/lib/use-dnd-sensors";
import { BulkDownloadButton } from "@/offline/bulk-download-button";
import { songCacheStateById } from "@/offline/cache-dot";
import { useCachedSongs } from "@/offline/use-cached";
import { MobileSongRow } from "@/setlists/editor/mobile-song-row";
import { PcDetailPane } from "@/setlists/editor/pc-detail-pane";
import { SongPickerModal } from "@/setlists/editor/song-picker-modal";
import { useSetlistForm } from "@/setlists/editor/use-setlist-form";
import { useSetlistTotals } from "@/setlists/editor/use-setlist-totals";
import { useSongPicker } from "@/setlists/editor/use-song-picker";
import type { getSetlist } from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconPlay, IconPlus, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";
import { TopBar } from "@/ui/top-bar";

type LoaderData = NonNullable<Awaited<ReturnType<typeof getSetlist>>>;

export type SetlistEditorProps = { mode: "new" } | { mode: "edit"; setlistId: string; data: LoaderData };

const EMPTY_SETLIST_DATA: LoaderData = {
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
  const form = useSetlistForm({ data, isNew, editSetlistId });
  const { totalSongSections, totalMinutes } = useSetlistTotals(form.songs);
  const cachedSongs = useCachedSongs();

  const selectedSongIds = useMemo(() => form.songs.map((s) => s.songId), [form.songs]);
  const picker = useSongPicker({ editSetlistId, selectedSongIds });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sensors = useDndSensors();

  const fallbackTitle = isNew ? t.setlist.newSetlist : data.setlist.title;
  const songCountLabel = `${String(form.songs.length).padStart(2, "0")} ${t.nav.songs.toUpperCase()}`;
  const subtitle = form.sessionDate ? `${form.sessionDate} · ${songCountLabel}` : songCountLabel;

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    await form.executeDelete();
  };

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
        title={form.title}
        fallbackTitle={fallbackTitle}
        description={form.description}
        sessionDate={form.sessionDate}
        venue={form.venue}
        titleError={form.titleError}
        songs={form.songs}
        saving={form.saving}
        saved={form.saved}
        isDirty={form.isDirty}
        setlistId={editSetlistId}
        isNew={isNew}
        totalSongSections={totalSongSections}
        totalMinutes={totalMinutes}
        cachedSongs={cachedSongs}
        onTitleChange={form.setTitle}
        onDescriptionChange={form.setDescription}
        onSessionDateChange={form.setSessionDate}
        onVenueChange={form.setVenue}
        onSave={form.handleSave}
        onDelete={() => setShowDeleteConfirm(true)}
        onDragEnd={form.handleDragEnd}
        onRemoveSong={form.handleRemoveSong}
        onOpenPicker={() => picker.setOpen(true)}
      />

      <TopBar
        left={
          <Link
            to="/setlists"
            aria-label={t.common.back}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              color: "var(--color-text)",
              lineHeight: 1,
            }}
          >
            <IconBack size={18} />
          </Link>
        }
        title={form.title.trim() || fallbackTitle}
        subtitle={subtitle}
        right={
          <div className="flex items-center gap-1">
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={t.common.delete}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  color: "var(--color-dim)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                <IconTrash size={16} />
              </button>
            )}
            {!isNew && editSetlistId && form.songs.length > 0 && (
              <Link
                to="/songs/$id/perform"
                params={{ id: form.songs[0].songId }}
                search={{ setlistId: editSetlistId }}
                aria-label={t.perform.start}
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-text-on-accent)",
                  border: "1px solid var(--color-accent)",
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
                  textDecoration: "none",
                }}
              >
                <IconPlay size={10} />
                {t.perform.start.toUpperCase()}
              </Link>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-2xl px-5 pb-36 pt-6 lg:hidden">
        <section className="grid gap-4">
          <MetaTag>01 · SETLIST META</MetaTag>
          <ConsoleField label={t.setlist.title} value={form.title} onChange={form.setTitle} required />
          {form.titleError && (
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
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-line)",
                borderLeft: form.description ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
                padding: "12px 14px",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--color-text)",
                outline: "none",
                borderRadius: 0,
                resize: "vertical",
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <ConsoleField
              label={t.setlist.sessionDate}
              value={form.sessionDate}
              onChange={form.setSessionDate}
              type="date"
              mono
            />
            <ConsoleField label={t.setlist.venue} value={form.venue} onChange={form.setVenue} />
          </div>
        </section>

        {totalSongSections.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between pb-3">
              <MetaTag>02 · TOTAL STRUCTURE · {String(totalSongSections.length).padStart(2, "0")} SECTIONS</MetaTag>
              {totalMinutes > 0 && <MetaTag>≈ {totalMinutes} MIN</MetaTag>}
            </div>
            <StructureBar sections={totalSongSections} height={6} gap={1} />
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between pb-4">
            <MetaTag>
              {totalSongSections.length > 0 ? "03" : "02"} · SONGS · {String(form.songs.length).padStart(2, "0")} TOTAL
            </MetaTag>
            {!isNew && <BulkDownloadButton songIds={form.songs.map((s) => s.songId)} />}
          </div>

          {form.songs.length === 0 ? (
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={form.handleDragEnd}>
              <SortableContext items={form.songs.map((s) => s.songId)} strategy={verticalListSortingStrategy}>
                <ul style={{ borderTop: "1px solid var(--color-line)" }}>
                  {form.songs.map((song, index) => (
                    <MobileSongRow
                      key={song.songId}
                      song={song}
                      index={index}
                      onRemove={() => form.handleRemoveSong(song.songId)}
                      cacheState={songCacheStateById(song.songId, cachedSongs)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <button
            type="button"
            onClick={() => picker.setOpen(true)}
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
          <ConsoleBtn
            type="button"
            tone="inverse"
            onClick={form.handleSave}
            disabled={form.saving || !form.isDirty}
            style={{ width: "100%", padding: "14px", fontSize: 11, justifyContent: "center" }}
          >
            {form.saving
              ? t.common.loading
              : form.saved
                ? t.setlist.saved
                : isNew
                  ? t.setlist.createSetlist
                  : t.common.saveChanges}
          </ConsoleBtn>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        message={t.setlist.confirmDelete}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <UnsavedChangesGuardModal isDirty={form.isDirty} />

      <SongPickerModal
        open={picker.open}
        input={picker.input}
        onInputChange={picker.setInput}
        availableSongs={picker.availableSongs}
        loading={picker.loading}
        setlistHasSongs={form.songs.length > 0}
        onAdd={form.handlePickerAdd}
        onClose={picker.close}
      />
    </div>
  );
}
