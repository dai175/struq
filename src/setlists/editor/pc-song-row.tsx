import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@/i18n";
import { CacheDot, type CacheState } from "@/offline/cache-dot";
import { PC_SONG_GRID_COLUMNS } from "@/setlists/editor/grid";
import type { SetlistSongItem } from "@/setlists/server-fns";
import { IconDrag, IconTrash } from "@/ui/icons";
import { StructureBar } from "@/ui/structure-bar";

export function PcSongRow({
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
        gridTemplateColumns: PC_SONG_GRID_COLUMNS,
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
        }}
      >
        <IconDrag size={14} />
      </button>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "0.05em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <div
          className="flex min-w-0 items-center gap-1.5"
          style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}
        >
          <span className="truncate">{song.title}</span>
          <CacheDot state={cacheState} />
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
      <div>
        <StructureBar sections={song.sections} height={5} gap={2} />
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
