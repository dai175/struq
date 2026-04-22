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
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import { generateSectionsInputSchema, saveSongWithSectionsInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import { isValidUrl } from "@/lib/validation";
import { SectionCard, type SectionData } from "@/songs/components/SectionCard";
import { SectionPalette } from "@/songs/components/SectionPalette";
import { DEFAULT_BARS } from "@/songs/constants";
import {
  deleteSong,
  generateSections,
  getSongWithSections,
  type SectionRow,
  saveSongWithSections,
} from "@/songs/server-fns";
import { ConsoleField } from "@/ui/console-field";
import { IconBack, IconExt, IconPlay, IconSparkles, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

function toSectionData(s: SectionRow): SectionData {
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

export const Route = createFileRoute("/songs/$id/")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    const data = await getSongWithSections({ data: { songId: params.id } });
    if (!data) throw redirect({ to: "/songs" });
    return data;
  },
  component: SongEditPage,
});

function SortableSection({
  section,
  onChange,
  onDelete,
}: {
  section: SectionData;
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
      <SectionCard
        section={section}
        onChange={onChange}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function SongEditPage() {
  const loaderData = Route.useLoaderData();
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const router = useRouter();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [title, setTitle] = useState(loaderData.song.title);
  const [artist, setArtist] = useState(loaderData.song.artist ?? "");
  const [bpm, setBpm] = useState(loaderData.song.bpm?.toString() ?? "");
  const [key, setKey] = useState(loaderData.song.key ?? "");
  const [referenceUrl, setReferenceUrl] = useState(loaderData.song.referenceUrl ?? "");
  const [titleError, setTitleError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [sectionsList, setSectionsList] = useState<SectionData[]>(loaderData.sections.map(toSectionData));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiRateLimited, setAiRateLimited] = useState(false);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const handleCancelAiConfirm = useCallback(() => setShowAiConfirm(false), []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCancelDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);

  useEffect(() => {
    setTitle(loaderData.song.title);
    setArtist(loaderData.song.artist ?? "");
    setBpm(loaderData.song.bpm?.toString() ?? "");
    setKey(loaderData.song.key ?? "");
    setReferenceUrl(loaderData.song.referenceUrl ?? "");
    setSectionsList(loaderData.sections.map(toSectionData));
  }, [loaderData]);

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
    const parsed = saveSongWithSectionsInputSchema.safeParse({
      song: {
        id,
        title: title.trim(),
        artist: artist.trim() || undefined,
        bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : undefined,
        key: key.trim() || undefined,
        referenceUrl: referenceUrl.trim() || undefined,
      },
      sections: sectionsList.map((s, i) => ({
        type: s.type,
        label: s.label,
        bars: s.bars,
        extraBeats: s.extraBeats,
        chordProgression: s.chordProgression,
        memo: s.memo,
        sortOrder: i,
      })),
    });
    if (!parsed.success) {
      const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "song" && issue.path[1] === "title");
      const hasUrlIssue = parsed.error.issues.some(
        (issue) => issue.path[0] === "song" && issue.path[1] === "referenceUrl",
      );
      if (hasTitleIssue) setTitleError(true);
      else if (hasUrlIssue) setUrlError(true);
      else toast.error(t.common.errorSaveFailed);
      return;
    }

    setSaving(true);
    try {
      await saveSongWithSections({ data: parsed.data });
      setSaved(true);
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
    setShowDeleteConfirm(false);
    try {
      await deleteSong({ data: { id } });
      navigate({ to: "/songs" });
    } catch (error) {
      clientLogger.error("deleteSong", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }

  const totalBars = sectionsList.reduce((sum, s) => sum + s.bars, 0);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* TopRail */}
      <div
        className="grid items-center gap-3"
        style={{
          gridTemplateColumns: "auto 1fr auto",
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <Link to="/songs" aria-label={t.common.back} style={{ color: "#fff", padding: 6 }}>
          <IconBack size={20} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
            {title || t.song.title}
          </div>
          <div style={{ marginTop: 3 }}>
            <MetaTag size={9}>
              EDITING · {String(sectionsList.length).padStart(2, "0")} SECTIONS · {totalBars} BARS
            </MetaTag>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/songs/$id/perform"
            params={{ id }}
            aria-label="Perform"
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
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t.song.deleteSong}
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
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-40 pt-6 lg:px-10">
        <section className="grid gap-4">
          <MetaTag>01 · TRACK META</MetaTag>
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
                marginTop: -8,
              }}
            >
              {t.song.titleRequired}
            </p>
          )}
          <ConsoleField label={t.song.artist} value={artist} onChange={setArtist} />
          <div className="grid grid-cols-2 gap-3">
            <ConsoleField label={t.song.bpm} value={bpm} onChange={setBpm} type="number" placeholder="120" mono />
            <ConsoleField label={t.song.key} value={key} onChange={setKey} placeholder="Am" mono />
          </div>
          <div>
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
        </section>

        {sectionsList.length > 0 && (
          <section className="mt-8">
            <MetaTag>02 · STRUCTURE PREVIEW</MetaTag>
            <div style={{ marginTop: 10 }}>
              <StructureBar sections={sectionsList} height={10} gap={2} showAbbreviations />
            </div>
          </section>
        )}

        <section className="mt-8">
          <MetaTag>AI · GENERATE STRUCTURE</MetaTag>
          <div className="mt-2">
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              className="flex w-full items-center justify-center gap-2"
              style={{
                padding: "13px",
                border: "1px solid var(--color-line-2)",
                background: "transparent",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                cursor: aiGenerating ? "not-allowed" : "pointer",
                opacity: aiGenerating ? 0.5 : 1,
                borderRadius: 2,
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
          </div>
        </section>

        <section className="mt-8">
          <MetaTag>03 · ADD SECTION</MetaTag>
          <div className="mt-2">
            <SectionPalette onAdd={handleAddSection} />
          </div>
        </section>

        <section className="mt-8">
          <MetaTag>04 · SECTIONS · {String(sectionsList.length).padStart(2, "0")} TOTAL</MetaTag>
          <div className="mt-3 grid gap-3">
            {sectionsList.length === 0 ? (
              <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
                {t.song.noSections}
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sectionsList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-3">
                    {sectionsList.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onChange={handleSectionChange}
                        onDelete={() => handleSectionDelete(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        <ConfirmModal
          open={showAiConfirm}
          message={t.song.aiConfirmReplace}
          confirmLabel={t.song.aiGenerate}
          cancelLabel={t.common.cancel}
          onConfirm={executeAiGenerate}
          onCancel={handleCancelAiConfirm}
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
        className="fixed right-0 left-0 z-40"
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
            {saving ? t.common.loading : saved ? t.song.saved : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
