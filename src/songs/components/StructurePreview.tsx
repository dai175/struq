import { StructureBar, type StructureBarSection } from "@/ui/structure-bar";

interface StructurePreviewProps {
  sections: StructureBarSection[];
}

/**
 * Thin wrapper over <StructureBar /> kept for backwards compatibility with
 * screens that imported StructurePreview before the shared primitive existed.
 * New call sites should use <StructureBar /> directly with an explicit
 * `height` / `tone` / `showAbbreviations` to match the broadcast spec.
 */
export function StructurePreview({ sections }: StructurePreviewProps) {
  return <StructureBar sections={sections} height={8} gap={2} />;
}
