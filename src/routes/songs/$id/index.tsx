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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import {
  createSongWithSectionsInputSchema,
  generateSectionsInputSchema,
  saveSongWithSectionsInputSchema,
} from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import { isValidUrl } from "@/lib/validation";
import { SectionPalette } from "@/songs/components/SectionPalette";
import { type SectionData, SectionRow, type SectionRowVariant } from "@/songs/components/SectionRow";
import { DEFAULT_BARS, PALETTE_TYPES, SECTION_COLORS } from "@/songs/constants";
import {
  createSongWithSections,
  deleteSong,
  generateSections,
  getSongWithSections,
  type SectionRow as SectionDbRow,
  type SongRow,
  saveSongWithSections,
} from "@/songs/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconExt, IconPlay, IconSparkles, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";
import { TopBar } from "@/ui/top-bar";

function toSectionData(s: SectionDbRow): SectionData {
  return {
    id: s.id,
    type: s.type,
    label: s.label,
    bars: s.bars,
    extraBeats: s.extraBeats,
    chordProgression: s.chordProgression,
    memo: s.memo,
  };
}

function buildSongSnapshot(data: { song: SongRow; sections: SectionDbRow[] }): string {
  const bpm = data.song.bpm;
  return JSON.stringify({
    title: data.song.title.trim(),
    artist: (data.song.artist ?? "").trim(),
    bpm: bpm != null && bpm > 0 ? bpm : null,
    key: (data.song.key ?? "").trim(),
    referenceUrl: (data.song.referenceUrl ?? "").trim(),
    sections: data.sections.map((s) => [s.type, s.label, s.bars, s.extraBeats, s.chordProgression, s.memo]),
  });
}

export const Route = createFileRoute("/songs/$id/")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    const data = await getSongWithSections({ data: { songId: params.id } });
    if (!data) throw redirect({ to: "/songs" });
    return data;
  },
  component: SongEditRoute,
});

function SongEditRoute() {
  const loaderData = Route.useLoaderData();
  const { id } = Route.useParams();
  return <SongEditor mode="edit" id={id} initial={loaderData} />;
}

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

function SortableSectionRow({
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

export function SongEditor(props: SongEditorProps) {
  const isNew = props.mode === "new";
  const initialData = props.mode === "edit" ? props.initial : EMPTY_SONG_SNAPSHOT;
  const editId = props.mode === "edit" ? props.id : null;

  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const router = useRouter();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [title, setTitle] = useState(initialData.song.title);
  const [artist, setArtist] = useState(initialData.song.artist ?? "");
  const [bpm, setBpm] = useState(initialData.song.bpm?.toString() ?? "");
  const [key, setKey] = useState(initialData.song.key ?? "");
  const [referenceUrl, setReferenceUrl] = useState(initialData.song.referenceUrl ?? "");
  const [titleError, setTitleError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [sectionsList, setSectionsList] = useState<SectionData[]>(initialData.sections.map(toSectionData));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiRateLimited, setAiRateLimited] = useState(false);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const handleCancelAiConfirm = useCallback(() => setShowAiConfirm(false), []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCancelDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);
  const savedSnapshotRef = useRef(buildSongSnapshot(initialData));

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when loader data changes
  useEffect(() => {
    if (isNew) return;
    setTitle(initialData.song.title);
    setArtist(initialData.song.artist ?? "");
    setBpm(initialData.song.bpm?.toString() ?? "");
    setKey(initialData.song.key ?? "");
    setReferenceUrl(initialData.song.referenceUrl ?? "");
    setSectionsList(initialData.sections.map(toSectionData));
    savedSnapshotRef.current = buildSongSnapshot(initialData);
  }, [initialData]);

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSectionsList((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleAiGenerate() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      return;
    }
    if (sectionsList.length > 0) {
      setShowAiConfirm(true);
      return;
    }
    void executeAiGenerate();
  }

  async function executeAiGenerate() {
    setShowAiConfirm(false);
    setAiGenerating(true);
    setAiError(false);
    setAiRateLimited(false);
    const trimmedTitle = title.trim();
    try {
      const aiInput = generateSectionsInputSchema.parse({
        title: trimmedTitle,
        artist: artist.trim(),
        key: key.trim() || undefined,
      });
      const sections = await generateSections({ data: aiInput });
      setSectionsList(sections);
    } catch (error) {
      clientLogger.error("generateSections", error);
      if (error instanceof Error && error.message === RATE_LIMIT_ERROR) {
        setAiRateLimited(true);
      } else {
        setAiError(true);
      }
    } finally {
      setAiGenerating(false);
    }
  }

  function handleAddSection(type: SectionType) {
    setSectionsList((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        label: null,
        bars: DEFAULT_BARS[type],
        extraBeats: 0,
        chordProgression: null,
        memo: null,
      },
    ]);
  }

  function handleSectionChange(updated: SectionData) {
    setSectionsList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleSectionDelete(sectionId: string) {
    setSectionsList((prev) => prev.filter((s) => s.id !== sectionId));
  }

  async function handleSave() {
    const parsedBpm = bpm ? Number.parseInt(bpm, 10) : undefined;
    const songPayload = {
      title: title.trim(),
      artist: artist.trim() || undefined,
      bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : undefined,
      key: key.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
    };
    const sectionsPayload = sectionsList.map((s, i) => ({
      type: s.type,
      label: s.label,
      bars: s.bars,
      extraBeats: s.extraBeats,
      chordProgression: s.chordProgression,
      memo: s.memo,
      sortOrder: i,
    }));

    function applyValidationError(
      issues: readonly { readonly path: readonly PropertyKey[] }[],
      fallbackKey: "save" | "create",
    ) {
      const hasTitleIssue = issues.some((issue) => issue.path[0] === "song" && issue.path[1] === "title");
      const hasUrlIssue = issues.some((issue) => issue.path[0] === "song" && issue.path[1] === "referenceUrl");
      if (hasTitleIssue) setTitleError(true);
      else if (hasUrlIssue) setUrlError(true);
      else toast.error(fallbackKey === "create" ? t.common.errorCreateFailed : t.common.errorSaveFailed);
    }

    if (isNew) {
      const parsed = createSongWithSectionsInputSchema.safeParse({
        song: songPayload,
        sections: sectionsPayload,
      });
      if (!parsed.success) {
        applyValidationError(parsed.error.issues, "create");
        return;
      }
      setSaving(true);
      try {
        const result = await createSongWithSections({ data: parsed.data });
        await router.invalidate();
        navigate({ to: "/songs/$id", params: { id: result.id }, search: {}, replace: true });
      } catch (error) {
        clientLogger.error("createSong", error);
        toast.error(t.common.errorCreateFailed);
        setSaving(false);
      }
      return;
    }

    const parsed = saveSongWithSectionsInputSchema.safeParse({
      song: { id: editId ?? "", ...songPayload },
      sections: sectionsPayload,
    });
    if (!parsed.success) {
      applyValidationError(parsed.error.issues, "save");
      return;
    }

    setSaving(true);
    try {
      await saveSongWithSections({ data: parsed.data });
      setSaved(true);
      savedSnapshotRef.current = currentSnapshot;
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      router.invalidate();
    } catch (error) {
      clientLogger.error("saveSong", error);
      toast.error(t.common.errorSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function executeDeleteSong() {
    if (!editId) return;
    setShowDeleteConfirm(false);
    try {
      await deleteSong({ data: { id: editId } });
      await router.invalidate();
      navigate({ to: "/songs" });
    } catch (error) {
      clientLogger.error("deleteSong", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }

  const totalBars = sectionsList.reduce((sum, s) => sum + s.bars, 0);
  const currentSnapshot = useMemo(() => {
    const parsedBpm = bpm ? Number.parseInt(bpm, 10) : undefined;
    return JSON.stringify({
      title: title.trim(),
      artist: artist.trim(),
      bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : null,
      key: key.trim(),
      referenceUrl: referenceUrl.trim(),
      sections: sectionsList.map((s) => [s.type, s.label, s.bars, s.extraBeats, s.chordProgression, s.memo]),
    });
  }, [title, artist, bpm, key, referenceUrl, sectionsList]);
  const isDirty = isNew || currentSnapshot !== savedSnapshotRef.current;
  const trimmedReferenceUrl = referenceUrl.trim();
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
        title={title}
        fallbackTitle={isNew ? t.nav.newSong : initialData.song.title}
        artist={artist}
        bpm={bpm}
        songKey={key}
        referenceUrl={referenceUrl}
        titleError={titleError}
        urlError={urlError}
        sectionsList={sectionsList}
        saving={saving}
        saved={saved}
        isDirty={isDirty}
        aiGenerating={aiGenerating}
        aiError={aiError}
        aiRateLimited={aiRateLimited}
        onTitleChange={(v) => {
          setTitle(v);
          if (titleError) setTitleError(false);
        }}
        onArtistChange={setArtist}
        onBpmChange={setBpm}
        onKeyChange={setKey}
        onReferenceUrlChange={(v) => {
          setReferenceUrl(v);
          if (urlError) setUrlError(false);
        }}
        onSave={handleSave}
        onDelete={() => setShowDeleteConfirm(true)}
        onAiGenerate={handleAiGenerate}
        onAiRetry={executeAiGenerate}
        onAddSection={handleAddSection}
        onSectionChange={handleSectionChange}
        onSectionDelete={handleSectionDelete}
        onDragEnd={handleDragEnd}
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
        title={title || t.song.title}
        subtitle={`EDITING · ${String(sectionsList.length).padStart(2, "0")} SECTIONS`}
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
              <ConsoleField
                label={t.song.title}
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
                    marginTop: 6,
                  }}
                >
                  {t.song.titleRequired}
                </p>
              )}
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <ConsoleField label={t.song.artist} value={artist} onChange={setArtist} />
            </div>
            <ConsoleField label={t.song.bpm} value={bpm} onChange={setBpm} type="number" placeholder="120" mono />
            <ConsoleField label={t.song.key} value={key} onChange={setKey} placeholder="Am" mono />
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ConsoleField
                label={t.song.referenceUrl}
                value={referenceUrl}
                onChange={(v) => {
                  setReferenceUrl(v);
                  if (urlError) setUrlError(false);
                }}
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
        </section>

        {sectionsList.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
              <MetaTag>02 · STRUCTURE</MetaTag>
              <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
              <MetaTag>{totalBars} BARS</MetaTag>
            </div>
            <StructureBar sections={sectionsList} height={8} gap={2} />
          </section>
        )}

        <section style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiGenerating}
            className="flex w-full items-center justify-center gap-2"
            style={{
              padding: 12,
              border: "1px solid var(--color-line-2)",
              background: "transparent",
              color: "var(--color-text-strong)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: aiGenerating ? "not-allowed" : "pointer",
              opacity: aiGenerating ? 0.5 : 1,
              borderRadius: 1,
            }}
          >
            <IconSparkles size={14} />
            {aiGenerating ? t.common.loading : t.song.aiGenerate}
          </button>
          {aiRateLimited && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                border: "1px solid var(--color-section-chorus)",
                background: "color-mix(in srgb, var(--color-section-chorus) 10%, transparent)",
                color: "var(--color-section-chorus)",
                fontSize: 13,
              }}
            >
              {t.song.aiRateLimited}
            </div>
          )}
          {aiError && (
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 8,
                padding: "10px 12px",
                border: "1px solid var(--color-section-solo)",
                background: "color-mix(in srgb, var(--color-section-solo) 10%, transparent)",
                color: "var(--color-section-solo)",
                fontSize: 13,
              }}
            >
              <span>{t.song.aiError}</span>
              <button
                type="button"
                onClick={executeAiGenerate}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-section-solo)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.common.retry}
              </button>
            </div>
          )}
        </section>

        <section style={{ marginTop: 22 }}>
          <MetaTag>03 · ADD SECTION</MetaTag>
          <div style={{ marginTop: 10 }}>
            <SectionPalette onAdd={handleAddSection} />
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
            <MetaTag>04 · SECTIONS</MetaTag>
            <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
            <MetaTag>{String(sectionsList.length).padStart(2, "0")}</MetaTag>
          </div>
          {sectionsList.length === 0 ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.song.noSections}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sectionsList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="grid gap-3">
                  {sectionsList.map((section, i) => (
                    <SortableSectionRow
                      key={section.id}
                      section={section}
                      index={i}
                      variant="mobile"
                      onChange={handleSectionChange}
                      onDelete={() => handleSectionDelete(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <ConfirmModal
          open={showAiConfirm}
          message={t.song.aiConfirmReplace}
          confirmLabel={t.song.aiGenerate}
          cancelLabel={t.common.cancel}
          onConfirm={executeAiGenerate}
          onCancel={handleCancelAiConfirm}
          tone="accent"
        />
        <ConfirmModal
          open={showDeleteConfirm}
          message={t.song.confirmDelete}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          onConfirm={executeDeleteSong}
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
            onClick={handleSave}
            disabled={saving || !isDirty}
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
              cursor: saving || !isDirty ? "not-allowed" : "pointer",
              opacity: saving || !isDirty ? 0.5 : 1,
            }}
          >
            {saving ? t.common.loading : saved ? t.song.saved : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───── PC editor pane ─────────────────────────────────────────────────

interface PcEditorPaneProps {
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
  sectionsList: SectionData[];
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

function PcEditorPane({
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
  sectionsList,
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
  const totalBars = sectionsList.reduce((sum, s) => sum + s.bars, 0);

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
              EDITING · {String(sectionsList.length).padStart(2, "0")} SECTIONS · {totalBars} BARS
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

          {sectionsList.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
                <MetaTag>02 · STRUCTURE PREVIEW</MetaTag>
                <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
              </div>
              <StructureBar sections={sectionsList} height={14} gap={2} showAbbreviations />
            </div>
          )}

          <button
            type="button"
            onClick={onAiGenerate}
            disabled={aiGenerating}
            className="flex w-full items-center justify-center gap-2"
            style={{
              marginTop: 20,
              padding: "12px",
              border: "1px solid var(--color-line-2)",
              background: "transparent",
              color: "var(--color-text-strong)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: aiGenerating ? "not-allowed" : "pointer",
              opacity: aiGenerating ? 0.5 : 1,
              borderRadius: 1,
            }}
          >
            <IconSparkles size={14} />
            {aiGenerating ? t.common.loading : t.song.aiGenerate}
          </button>
          {aiRateLimited && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                border: "1px solid var(--color-section-chorus)",
                background: "color-mix(in srgb, var(--color-section-chorus) 10%, transparent)",
                color: "var(--color-section-chorus)",
                fontSize: 13,
              }}
            >
              {t.song.aiRateLimited}
            </div>
          )}
          {aiError && (
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 8,
                padding: "10px 12px",
                border: "1px solid var(--color-section-solo)",
                background: "color-mix(in srgb, var(--color-section-solo) 10%, transparent)",
                color: "var(--color-section-solo)",
                fontSize: 13,
              }}
            >
              <span>{t.song.aiError}</span>
              <button
                type="button"
                onClick={onAiRetry}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-section-solo)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.common.retry}
              </button>
            </div>
          )}

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
            <MetaTag>{String(sectionsList.length).padStart(2, "0")} TOTAL</MetaTag>
          </div>

          {sectionsList.length === 0 ? (
            <p className="py-12 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.song.noSections}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sectionsList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="grid" style={{ gap: 8 }}>
                  {sectionsList.map((section, i) => (
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
