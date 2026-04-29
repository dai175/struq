import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { clientLogger } from "@/lib/client-logger";
import { createSongWithSectionsInputSchema, saveSongWithSectionsInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import type { SectionData } from "@/songs/components/SectionRow";
import { DEFAULT_BARS } from "@/songs/constants";
import { buildEditingSnapshot, buildLoadedSnapshot, toSectionData } from "@/songs/editor/song-snapshot";
import {
  createSongWithSections,
  deleteSong,
  type SectionRow as SectionDbRow,
  type SongRow,
  saveSongWithSections,
} from "@/songs/server-fns";

type LoadedData = { song: SongRow; sections: SectionDbRow[] };

export function useSongForm(params: { initialData: LoadedData; isNew: boolean; editId: string | null }) {
  const { initialData, isNew, editId } = params;
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const router = useRouter();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [title, setTitleRaw] = useState(initialData.song.title);
  const [artist, setArtist] = useState(initialData.song.artist ?? "");
  const [bpm, setBpm] = useState(initialData.song.bpm?.toString() ?? "");
  const [key, setKey] = useState(initialData.song.key ?? "");
  const [referenceUrl, setReferenceUrlRaw] = useState(initialData.song.referenceUrl ?? "");
  const [titleError, setTitleError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [sections, setSections] = useState<SectionData[]>(initialData.sections.map(toSectionData));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedSnapshotRef = useRef(buildLoadedSnapshot(initialData));

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when loader data changes
  useEffect(() => {
    if (isNew) return;
    setTitleRaw(initialData.song.title);
    setArtist(initialData.song.artist ?? "");
    setBpm(initialData.song.bpm?.toString() ?? "");
    setKey(initialData.song.key ?? "");
    setReferenceUrlRaw(initialData.song.referenceUrl ?? "");
    setSections(initialData.sections.map(toSectionData));
    savedSnapshotRef.current = buildLoadedSnapshot(initialData);
  }, [initialData]);

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  const setTitle = useCallback(
    (value: string) => {
      setTitleRaw(value);
      if (titleError) setTitleError(false);
    },
    [titleError],
  );

  const setReferenceUrl = useCallback(
    (value: string) => {
      setReferenceUrlRaw(value);
      if (urlError) setUrlError(false);
    },
    [urlError],
  );

  const currentSnapshot = useMemo(
    () => buildEditingSnapshot({ title, artist, bpm, key, referenceUrl, sections }),
    [title, artist, bpm, key, referenceUrl, sections],
  );
  const isDirty = currentSnapshot !== savedSnapshotRef.current;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleAddSection = useCallback((type: SectionType) => {
    setSections((prev) => [
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
  }, []);

  const handleSectionChange = useCallback((updated: SectionData) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleSectionDelete = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const handleSave = useCallback(async () => {
    const parsedBpm = bpm ? Number.parseInt(bpm, 10) : undefined;
    const songPayload = {
      title: title.trim(),
      artist: artist.trim() || undefined,
      bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : undefined,
      key: key.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
    };
    const sectionsPayload = sections.map((s, i) => ({
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
        savedSnapshotRef.current = currentSnapshot;
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
  }, [
    title,
    artist,
    bpm,
    key,
    referenceUrl,
    sections,
    isNew,
    editId,
    currentSnapshot,
    navigate,
    router,
    t.common.errorCreateFailed,
    t.common.errorSaveFailed,
    toast.error,
  ]);

  const executeDelete = useCallback(async () => {
    if (!editId) return;
    try {
      await deleteSong({ data: { id: editId } });
      await router.invalidate();
      navigate({ to: "/songs" });
    } catch (error) {
      clientLogger.error("deleteSong", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }, [editId, navigate, router, t.common.errorDeleteFailed, toast.error]);

  return {
    title,
    artist,
    bpm,
    key,
    referenceUrl,
    titleError,
    urlError,
    sections,
    saving,
    saved,
    isDirty,
    setTitle,
    setArtist,
    setBpm,
    setKey,
    setReferenceUrl,
    setTitleError,
    setSections,
    handleDragEnd,
    handleAddSection,
    handleSectionChange,
    handleSectionDelete,
    handleSave,
    executeDelete,
  };
}
