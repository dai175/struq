import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@/i18n";
import { CacheDot, type CacheState } from "@/offline/cache-dot";
import type { SetlistSongItem } from "@/setlists/server-fns";
import { IconDrag, IconTrash } from "@/ui/icons";
import { StructureBar } from "@/ui/structure-bar";

const ROW_STRUCTURE_PREVIEW_MAX = 6;

export function MobileSongRow({
  song,
  index,
  onRemove,
  cacheState,
}: {
  song: SetlistSongItem;
  index: number;
  onRemove: () => void;
  cacheState: CacheState;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.songId });

  const meta = [
    song.artist?.toUpperCase(),
    song.bpm != null ? `${song.bpm} BPM` : null,
    song.songKey ? song.songKey.toUpperCase() : null,
    song.sections.length > 0 ? `${String(song.sections.length).padStart(2, "0")} SEC` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      ref={setNodeRef}
      className="flex items-start"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        gap: 12,
        padding: "14px 4px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t.common.reorder}
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
          flexShrink: 0,
        }}
      >
        <IconDrag size={14} />
      </button>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 500,
          color: "var(--color-dim)",
          letterSpacing: "0.2em",
          width: 28,
          paddingTop: 4,
          flexShrink: 0,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="flex min-w-0 items-center gap-1.5"
          style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}
        >
          <span className="truncate">{song.title}</span>
          <CacheDot state={cacheState} />
        </div>
        {meta && (
          <div
            className="truncate"
            style={{
              marginTop: 3,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "var(--color-dim)",
              textTransform: "uppercase",
            }}
          >
            {meta}
          </div>
        )}
      </div>
      {song.sections.length > 0 && (
        <StructureBar
          sections={song.sections.slice(0, ROW_STRUCTURE_PREVIEW_MAX)}
          height={3}
          gap={1}
          style={{ width: 40, flexShrink: 0, marginTop: 8 }}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t.setlist.removeSong}
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-dim-2)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <IconTrash size={14} />
      </button>
    </li>
  );
}
