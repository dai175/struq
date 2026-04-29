import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { useDndSensors } from "@/lib/use-dnd-sensors";
import { BulkDownloadButton } from "@/offline/bulk-download-button";
import { songCacheStateById } from "@/offline/cache-dot";
import type { CachedSong } from "@/offline/db";
import { PC_SONG_GRID_COLUMNS } from "@/setlists/editor/grid";
import { PcSongRow } from "@/setlists/editor/pc-song-row";
import type { SetlistSongItem, SetlistSongSection } from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconPlay, IconPlus, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

export function PcDetailPane({
  title,
  fallbackTitle,
  description,
  sessionDate,
  venue,
  titleError,
  songs,
  saving,
  saved,
  isDirty,
  setlistId,
  isNew,
  totalSongSections,
  totalMinutes,
  cachedSongs,
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
  isDirty: boolean;
  setlistId: string | null;
  isNew: boolean;
  totalSongSections: SetlistSongSection[];
  totalMinutes: number;
  cachedSongs: ReadonlyMap<string, CachedSong>;
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
  const sensors = useDndSensors();
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
          <ConsoleBtn tone="inverse" onClick={onSave} disabled={saving || !isDirty}>
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
                color: "var(--color-text-on-accent)",
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
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-line)",
                    borderLeft: description ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
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
          <div className="flex items-center" style={{ gap: 12 }}>
            <MetaTag>02 · OVERVIEW</MetaTag>
            {totalMinutes > 0 && <MetaTag>≈ {totalMinutes} MIN</MetaTag>}
          </div>
          <div style={{ marginTop: 14 }}>
            <OverviewStat label="SONGS" value={String(songs.length).padStart(2, "0")} />
          </div>
          {totalSongSections.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <StructureBar sections={totalSongSections} height={6} gap={1} />
            </div>
          )}
        </section>

        {/* 03 SONGS */}
        <section style={{ marginTop: 32 }}>
          <div className="flex items-center" style={{ marginBottom: 14, gap: 10 }}>
            <MetaTag>03 · SONGS · {String(songs.length).padStart(2, "0")} TOTAL</MetaTag>
            <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
            {!isNew && <BulkDownloadButton songIds={songs.map((s) => s.songId)} />}
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
                  gridTemplateColumns: PC_SONG_GRID_COLUMNS,
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
                <div>STRUCTURE</div>
                <div />
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={songs.map((s) => s.songId)} strategy={verticalListSortingStrategy}>
                  {songs.map((song, i) => (
                    <PcSongRow
                      key={song.songId}
                      song={song}
                      index={i}
                      onRemove={() => onRemoveSong(song.songId)}
                      cacheState={songCacheStateById(song.songId, cachedSongs)}
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
