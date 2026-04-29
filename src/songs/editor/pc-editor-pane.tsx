import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { useDndSensors } from "@/lib/use-dnd-sensors";
import { isValidUrl } from "@/lib/validation";
import type { SectionData } from "@/songs/components/SectionRow";
import { PALETTE_TYPES, SECTION_COLORS } from "@/songs/constants";
import { AiGeneratePanel } from "@/songs/editor/ai-generate-panel";
import { SortableSectionRow } from "@/songs/editor/sortable-section-row";
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconExt, IconPlay, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

export interface PcEditorPaneProps {
  id: string | null;
  isNew: boolean;
  title: string;
  fallbackTitle: string;
  artist: string;
  bpm: string;
  songKey: string;
  referenceUrl: string;
  titleError: boolean;
  urlError: boolean;
  sections: SectionData[];
  saving: boolean;
  saved: boolean;
  isDirty: boolean;
  aiGenerating: boolean;
  aiError: boolean;
  aiRateLimited: boolean;
  onTitleChange: (v: string) => void;
  onArtistChange: (v: string) => void;
  onBpmChange: (v: string) => void;
  onKeyChange: (v: string) => void;
  onReferenceUrlChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onAiGenerate: () => void;
  onAiRetry: () => void;
  onAddSection: (type: SectionType) => void;
  onSectionChange: (updated: SectionData) => void;
  onSectionDelete: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function PcEditorPane({
  id,
  isNew,
  title,
  fallbackTitle,
  artist,
  bpm,
  songKey,
  referenceUrl,
  titleError,
  urlError,
  sections,
  saving,
  saved,
  isDirty,
  aiGenerating,
  aiError,
  aiRateLimited,
  onTitleChange,
  onArtistChange,
  onBpmChange,
  onKeyChange,
  onReferenceUrlChange,
  onSave,
  onDelete,
  onAiGenerate,
  onAiRetry,
  onAddSection,
  onSectionChange,
  onSectionDelete,
  onDragEnd,
}: PcEditorPaneProps) {
  const { t } = useI18n();
  const sensors = useDndSensors();
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);

  return (
    <div className="hidden min-h-screen lg:block" style={{ background: "var(--color-ink)" }}>
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
              color: "var(--color-text-strong)",
            }}
          >
            {title.trim() || fallbackTitle}
          </div>
          <div style={{ marginTop: 3 }}>
            <MetaTag size={10}>
              EDITING · {String(sections.length).padStart(2, "0")} SECTIONS · {totalBars} BARS
            </MetaTag>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                ? t.song.saved
                : isNew
                  ? t.song.createSong.toUpperCase()
                  : t.common.saveChanges.toUpperCase()}
          </ConsoleBtn>
          {!isNew && id && (
            <Link
              to="/songs/$id/perform"
              params={{ id }}
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
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid xl:grid-cols-[380px_1fr] xl:gap-0">
        {/* META column */}
        <div
          className="xl:border-r"
          style={{
            padding: "22px 28px",
            borderColor: "var(--color-line)",
          }}
        >
          <MetaTag>01 · TRACK META</MetaTag>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ gridColumn: "span 2" }}>
              <ConsoleField label={t.song.title} value={title} onChange={onTitleChange} required />
              {titleError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-section-solo)",
                    marginTop: 6,
                  }}
                >
                  {t.song.titleRequired}
                </p>
              )}
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <ConsoleField label={t.song.artist} value={artist} onChange={onArtistChange} />
            </div>
            <ConsoleField label={t.song.bpm} value={bpm} onChange={onBpmChange} type="number" placeholder="120" mono />
            <ConsoleField label={t.song.key} value={songKey} onChange={onKeyChange} placeholder="Am" mono />
            <div style={{ gridColumn: "span 2" }}>
              <ConsoleField
                label={t.song.referenceUrl}
                value={referenceUrl}
                onChange={onReferenceUrlChange}
                type="url"
                placeholder="https://..."
                mono
              />
              {urlError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-section-solo)",
                    marginTop: 6,
                  }}
                >
                  {t.song.invalidUrl}
                </p>
              )}
              {isValidUrl(referenceUrl.trim()) && (
                <a
                  href={referenceUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                  style={{
                    marginTop: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    color: "var(--color-dim)",
                    textTransform: "uppercase",
                  }}
                >
                  <IconExt size={12} /> OPEN LINK
                </a>
              )}
            </div>
          </div>

          {sections.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
                <MetaTag>02 · STRUCTURE PREVIEW</MetaTag>
                <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
              </div>
              <StructureBar sections={sections} height={14} gap={2} showAbbreviations />
            </div>
          )}

          <AiGeneratePanel
            generating={aiGenerating}
            error={aiError}
            rateLimited={aiRateLimited}
            containerStyle={{ marginTop: 20 }}
            onGenerate={onAiGenerate}
            onRetry={onAiRetry}
          />

          <div style={{ marginTop: 22 }}>
            <MetaTag>03 · ADD SECTION</MetaTag>
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
              }}
            >
              {PALETTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onAddSection(type)}
                  style={{
                    padding: "10px 4px",
                    border: "1px solid var(--color-line)",
                    borderRadius: 1,
                    background: "var(--color-bg-elevated)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      background: SECTION_COLORS[type],
                      borderRadius: 1,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      color: "var(--color-dim)",
                      textTransform: "uppercase",
                    }}
                  >
                    {type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTIONS column */}
        <div style={{ padding: "22px 28px 48px" }}>
          <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
            <MetaTag>04 · SECTIONS</MetaTag>
            <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
            <MetaTag>{String(sections.length).padStart(2, "0")} TOTAL</MetaTag>
          </div>

          {sections.length === 0 ? (
            <p className="py-12 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.song.noSections}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="grid" style={{ gap: 8 }}>
                  {sections.map((section, i) => (
                    <SortableSectionRow
                      key={section.id}
                      section={section}
                      index={i}
                      variant="pc"
                      onChange={onSectionChange}
                      onDelete={() => onSectionDelete(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
