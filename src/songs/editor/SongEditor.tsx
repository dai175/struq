import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useI18n } from "@/i18n";
import { ConfirmModal } from "@/lib/confirm-modal";
import { UnsavedChangesGuardModal } from "@/lib/unsaved-changes-guard-modal";
import { isValidUrl } from "@/lib/validation";
import { SectionPalette } from "@/songs/components/SectionPalette";
import { AiGeneratePanel } from "@/songs/editor/ai-generate-panel";
import { PcEditorPane } from "@/songs/editor/pc-editor-pane";
import { SortableSectionRow } from "@/songs/editor/sortable-section-row";
import { useAiGenerate } from "@/songs/editor/use-ai-generate";
import { useSongForm } from "@/songs/editor/use-song-form";
import type { SectionRow as SectionDbRow, SongRow } from "@/songs/server-fns";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconExt, IconPlay, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";
import { TopBar } from "@/ui/top-bar";

export type SongEditorProps =
  | { mode: "new" }
  | { mode: "edit"; id: string; initial: { song: SongRow; sections: SectionDbRow[] } };

const EMPTY_SONG_SNAPSHOT = {
  song: {
    id: "",
    title: "",
    artist: null,
    bpm: null,
    key: null,
    referenceUrl: null,
    createdAt: 0,
    updatedAt: 0,
  } satisfies SongRow,
  sections: [] as SectionDbRow[],
};

export function SongEditor(props: SongEditorProps) {
  const isNew = props.mode === "new";
  const initialData = props.mode === "edit" ? props.initial : EMPTY_SONG_SNAPSHOT;
  const editId = props.mode === "edit" ? props.id : null;

  const { t } = useI18n();
  const form = useSongForm({ initialData, isNew, editId });
  const ai = useAiGenerate(form.setSections);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCancelDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleAiGenerate = useCallback(() => {
    if (!form.title.trim()) {
      form.setTitleError(true);
      return;
    }
    if (form.sections.length > 0) {
      ai.setShowConfirm(true);
      return;
    }
    void ai.execute({ title: form.title, artist: form.artist, key: form.key });
  }, [form.title, form.artist, form.key, form.sections.length, form.setTitleError, ai]);

  const handleAiRetry = useCallback(() => {
    void ai.execute({ title: form.title, artist: form.artist, key: form.key });
  }, [form.title, form.artist, form.key, ai]);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    await form.executeDelete();
  }, [form.executeDelete]);

  const totalBars = form.sections.reduce((sum, s) => sum + s.bars, 0);
  const trimmedReferenceUrl = form.referenceUrl.trim();
  const referenceUrlOpenable = isValidUrl(trimmedReferenceUrl);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <PcEditorPane
        id={editId}
        isNew={isNew}
        title={form.title}
        fallbackTitle={isNew ? t.nav.newSong : initialData.song.title}
        artist={form.artist}
        bpm={form.bpm}
        songKey={form.key}
        referenceUrl={form.referenceUrl}
        titleError={form.titleError}
        urlError={form.urlError}
        sections={form.sections}
        saving={form.saving}
        saved={form.saved}
        isDirty={form.isDirty}
        aiGenerating={ai.generating}
        aiError={ai.error}
        aiRateLimited={ai.rateLimited}
        onTitleChange={form.setTitle}
        onArtistChange={form.setArtist}
        onBpmChange={form.setBpm}
        onKeyChange={form.setKey}
        onReferenceUrlChange={form.setReferenceUrl}
        onSave={form.handleSave}
        onDelete={() => setShowDeleteConfirm(true)}
        onAiGenerate={handleAiGenerate}
        onAiRetry={handleAiRetry}
        onAddSection={form.handleAddSection}
        onSectionChange={form.handleSectionChange}
        onSectionDelete={form.handleSectionDelete}
        onDragEnd={form.handleDragEnd}
      />

      <TopBar
        left={
          <Link
            to="/songs"
            aria-label={t.common.back}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              color: "var(--color-text-strong)",
              lineHeight: 1,
            }}
          >
            <IconBack size={18} />
          </Link>
        }
        title={form.title || t.song.title}
        subtitle={`EDITING · ${String(form.sections.length).padStart(2, "0")} SECTIONS`}
        right={
          <div className="flex items-center gap-1">
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={t.song.deleteSong}
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
            {!isNew && editId && (
              <Link
                to="/songs/$id/perform"
                params={{ id: editId }}
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

      <div className="pb-40 lg:hidden" style={{ padding: "16px 18px 160px" }}>
        <section>
          <MetaTag>01 · TRACK META</MetaTag>
          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ gridColumn: "span 2" }}>
              <ConsoleField label={t.song.title} value={form.title} onChange={form.setTitle} required />
              {form.titleError && (
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
              <ConsoleField label={t.song.artist} value={form.artist} onChange={form.setArtist} />
            </div>
            <ConsoleField
              label={t.song.bpm}
              value={form.bpm}
              onChange={form.setBpm}
              type="number"
              placeholder="120"
              mono
            />
            <ConsoleField label={t.song.key} value={form.key} onChange={form.setKey} placeholder="Am" mono />
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ConsoleField
                label={t.song.referenceUrl}
                value={form.referenceUrl}
                onChange={form.setReferenceUrl}
                type="url"
                placeholder="https://..."
                mono
              />
            </div>
            <a
              href={referenceUrlOpenable ? trimmedReferenceUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.song.openReferenceUrl}
              aria-disabled={!referenceUrlOpenable}
              tabIndex={referenceUrlOpenable ? 0 : -1}
              style={{
                padding: 12,
                border: "1px solid var(--color-line-2)",
                color: "var(--color-dim)",
                borderRadius: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: referenceUrlOpenable ? 1 : 0.35,
                cursor: referenceUrlOpenable ? "pointer" : "not-allowed",
                pointerEvents: referenceUrlOpenable ? "auto" : "none",
              }}
            >
              <IconExt size={14} />
            </a>
          </div>
          {form.urlError && (
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
        </section>

        {form.sections.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
              <MetaTag>02 · STRUCTURE</MetaTag>
              <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
              <MetaTag>{totalBars} BARS</MetaTag>
            </div>
            <StructureBar sections={form.sections} height={8} gap={2} />
          </section>
        )}

        <AiGeneratePanel
          generating={ai.generating}
          error={ai.error}
          rateLimited={ai.rateLimited}
          containerStyle={{ marginTop: 16 }}
          onGenerate={handleAiGenerate}
          onRetry={handleAiRetry}
        />

        <section style={{ marginTop: 22 }}>
          <MetaTag>03 · ADD SECTION</MetaTag>
          <div style={{ marginTop: 10 }}>
            <SectionPalette onAdd={form.handleAddSection} />
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
            <MetaTag>04 · SECTIONS</MetaTag>
            <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
            <MetaTag>{String(form.sections.length).padStart(2, "0")}</MetaTag>
          </div>
          {form.sections.length === 0 ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.song.noSections}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={form.handleDragEnd}>
              <SortableContext items={form.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="grid gap-3">
                  {form.sections.map((section, i) => (
                    <SortableSectionRow
                      key={section.id}
                      section={section}
                      index={i}
                      variant="mobile"
                      onChange={form.handleSectionChange}
                      onDelete={() => form.handleSectionDelete(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <ConfirmModal
          open={ai.showConfirm}
          message={t.song.aiConfirmReplace}
          confirmLabel={t.song.aiGenerate}
          cancelLabel={t.common.cancel}
          onConfirm={() => ai.execute({ title: form.title, artist: form.artist, key: form.key })}
          onCancel={() => ai.setShowConfirm(false)}
          tone="accent"
        />
        <ConfirmModal
          open={showDeleteConfirm}
          message={t.song.confirmDelete}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDeleteConfirm}
        />
      </div>

      {/* Sticky save — above the BottomNav */}
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
            onClick={form.handleSave}
            disabled={form.saving || !form.isDirty}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--color-text-strong)",
              color: "var(--color-ink)",
              border: "none",
              borderRadius: 2,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: form.saving || !form.isDirty ? "not-allowed" : "pointer",
              opacity: form.saving || !form.isDirty ? 0.5 : 1,
            }}
          >
            {form.saving ? t.common.loading : form.saved ? t.song.saved : t.common.save}
          </button>
        </div>
      </div>

      <UnsavedChangesGuardModal isDirty={form.isDirty} />
    </div>
  );
}
