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
import { ArrowLeft, ExternalLink, Play, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { SectionCard, type SectionData } from "@/songs/components/SectionCard";
import { SectionPalette } from "@/songs/components/SectionPalette";
import { StructurePreview } from "@/songs/components/StructurePreview";
import { DEFAULT_BARS } from "@/songs/constants";
import {
  deleteSong,
  generateSections,
  getSongWithSections,
  type SectionRow,
  saveSections,
  updateSong,
} from "@/songs/server-fns";

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
  const navigate = useNavigate();
  const router = useRouter();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [title, setTitle] = useState(loaderData.song.title);
  const [artist, setArtist] = useState(loaderData.song.artist ?? "");
  const [bpm, setBpm] = useState(loaderData.song.bpm?.toString() ?? "");
  const [key, setKey] = useState(loaderData.song.key ?? "");
  const [referenceUrl, setReferenceUrl] = useState(loaderData.song.referenceUrl ?? "");
  const [titleError, setTitleError] = useState(false);
  const [sectionsList, setSectionsList] = useState<SectionData[]>(loaderData.sections.map(toSectionData));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(false);

  // Sync state when loader data changes (e.g., after router.invalidate)
  useEffect(() => {
    setTitle(loaderData.song.title);
    setArtist(loaderData.song.artist ?? "");
    setBpm(loaderData.song.bpm?.toString() ?? "");
    setKey(loaderData.song.key ?? "");
    setReferenceUrl(loaderData.song.referenceUrl ?? "");
    setSectionsList(loaderData.sections.map(toSectionData));
  }, [loaderData]);

  // Cleanup saved timer on unmount
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

  async function handleAiGenerate() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      return;
    }

    if (sectionsList.length > 0) {
      if (!confirm(t.song.aiConfirmReplace)) return;
    }

    setAiGenerating(true);
    setAiError(false);
    try {
      const sections = await generateSections({
        data: { title: trimmedTitle, artist: artist.trim() },
      });
      setSectionsList(sections);
    } catch (error) {
      console.error("Failed to generate sections:", error);
      setAiError(true);
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
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }

    const parsedBpm = bpm ? parseInt(bpm, 10) : undefined;

    setSaving(true);
    try {
      await Promise.all([
        updateSong({
          data: {
            id,
            title: trimmed,
            artist: artist.trim() || undefined,
            bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : undefined,
            key: key.trim() || undefined,
            referenceUrl: referenceUrl.trim() || undefined,
          },
        }),
        saveSections({
          data: {
            songId: id,
            sections: sectionsList.map((s, i) => ({
              type: s.type,
              label: s.label,
              bars: s.bars,
              extraBeats: s.extraBeats,
              chordProgression: s.chordProgression,
              memo: s.memo,
              sortOrder: i,
            })),
          },
        }),
      ]);

      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      router.invalidate();
    } catch (error) {
      console.error("Failed to save song:", error);
      alert(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSong() {
    if (!confirm(t.song.confirmDelete)) return;
    try {
      await deleteSong({ data: { id } });
      navigate({ to: "/songs" });
    } catch (error) {
      console.error("Failed to delete song:", error);
      alert(t.common.error);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          to="/songs"
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-muted"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{title || t.song.title}</h1>
        <Link
          to="/songs/$id/perform"
          params={{ id }}
          className="rounded-full p-2 transition-colors hover:bg-surface-muted"
        >
          <Play size={20} />
        </Link>
        <button
          type="button"
          onClick={handleDeleteSong}
          className="rounded-full p-2 text-text-secondary transition-colors hover:text-red-500"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="song-title" className="mb-1 block text-sm text-text-secondary">
            {t.song.title} *
          </label>
          <input
            id="song-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            aria-describedby={titleError ? "song-title-error" : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              titleError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {titleError && (
            <p id="song-title-error" className="mt-1 text-xs text-red-500">
              {t.song.titleRequired}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="song-artist" className="mb-1 block text-sm text-text-secondary">
            {t.song.artist}
          </label>
          <input
            id="song-artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="song-bpm" className="mb-1 block text-sm text-text-secondary">
              {t.song.bpm}
            </label>
            <input
              id="song-bpm"
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="120"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 font-mono text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="song-key" className="mb-1 block text-sm text-text-secondary">
              {t.song.key}
            </label>
            <input
              id="song-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Am"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="song-reference-url" className="mb-1 block text-sm text-text-secondary">
            {t.song.referenceUrl}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="song-reference-url"
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
            {referenceUrl.trim() && (
              <a
                href={referenceUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full p-2.5 text-text-secondary transition-colors hover:bg-surface-muted"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </div>

      {sectionsList.length > 0 && (
        <div className="mt-6">
          <StructurePreview sections={sectionsList} />
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
        >
          <Sparkles size={16} />
          {aiGenerating ? t.common.loading : t.song.aiGenerate}
        </button>
        {aiError && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <span>{t.song.aiError}</span>
            <button type="button" onClick={handleAiGenerate} className="ml-2 shrink-0 font-medium underline">
              {t.common.retry}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <SectionPalette onAdd={handleAddSection} />
      </div>

      <div className="mt-6 space-y-3">
        {sectionsList.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">{t.song.noSections}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionsList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
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

      {/* Sticky save — sits above bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-surface px-4 py-3">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
          >
            {saving ? t.common.loading : saved ? t.song.saved : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
