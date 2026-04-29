import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type SectionData, SectionRow, type SectionRowVariant } from "@/songs/components/SectionRow";

export function SortableSectionRow({
  section,
  index,
  variant,
  onChange,
  onDelete,
}: {
  section: SectionData;
  index: number;
  variant: SectionRowVariant;
  onChange: (updated: SectionData) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <SectionRow
        section={section}
        index={index}
        variant={variant}
        onChange={onChange}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
}
