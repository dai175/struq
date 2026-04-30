import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { createSetlistWithSongsInputSchema, saveSetlistWithSongsInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import type { PickerSong } from "@/setlists/editor/use-song-picker";
import {
  createSetlistWithSongs,
  deleteSetlist,
  type getSetlist,
  type SetlistSongItem,
  saveSetlistWithSongs,
} from "@/setlists/server-fns";
import { getSongWithSections } from "@/songs/server-fns";

type LoaderData = NonNullable<Awaited<ReturnType<typeof getSetlist>>>;

function snapshotOf(state: {
  title: string;
  description: string;
  sessionDate: string;
  venue: string;
  songIds: string[];
}): string {
  return JSON.stringify({
    title: state.title.trim(),
    description: state.description.trim(),
    sessionDate: state.sessionDate,
    venue: state.venue.trim(),
    songIds: state.songIds,
  });
}

export function useSetlistForm(params: { data: LoaderData; isNew: boolean; editSetlistId: string | null }) {
  const { data, isNew, editSetlistId } = params;
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const router = useRouter();

  const [title, setTitleRaw] = useState(data.setlist.title);
  const [description, setDescription] = useState(data.setlist.description ?? "");
  const [sessionDate, setSessionDate] = useState(data.setlist.sessionDate ?? "");
  const [venue, setVenue] = useState(data.setlist.venue ?? "");
  const [titleError, setTitleError] = useState(false);
  const [songs, setSongs] = useState<SetlistSongItem[]>(data.songs);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef(
    snapshotOf({
      title: data.setlist.title,
      description: data.setlist.description ?? "",
      sessionDate: data.setlist.sessionDate ?? "",
      venue: data.setlist.venue ?? "",
      songIds: data.songs.map((s) => s.songId),
    }),
  );

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const setTitle = useCallback(
    (value: string) => {
      setTitleRaw(value);
      if (titleError) setTitleError(false);
    },
    [titleError],
  );

  const currentSnapshot = useMemo(
    () =>
      snapshotOf({
        title,
        description,
        sessionDate,
        venue,
        songIds: songs.map((s) => s.songId),
      }),
    [title, description, sessionDate, venue, songs],
  );
  const isDirty = currentSnapshot !== savedSnapshotRef.current;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSongs((prev) => {
      const oldIndex = prev.findIndex((s) => s.songId === active.id);
      const newIndex = prev.findIndex((s) => s.songId === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleRemoveSong = useCallback((songId: string) => {
    setSongs((prev) => prev.filter((s) => s.songId !== songId));
  }, []);

  const handlePickerAdd = useCallback(
    async (song: PickerSong) => {
      setSongs((prev) => [
        ...prev,
        {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          bpm: null,
          songKey: null,
          sortOrder: prev.length,
          sections: [],
        },
      ]);
      try {
        const detail = await getSongWithSections({ data: { songId: song.id } });
        if (!detail) {
          setSongs((prev) => prev.filter((s) => s.songId !== song.id));
          toast.error(t.common.errorLoadFailed);
          return;
        }
        setSongs((prev) =>
          prev.map((s) =>
            s.songId === song.id
              ? {
                  ...s,
                  bpm: detail.song.bpm,
                  songKey: detail.song.key,
                  sections: detail.sections.map((sec) => ({
                    id: sec.id,
                    type: sec.type,
                    bars: sec.bars,
                    sortOrder: sec.sortOrder,
                  })),
                }
              : s,
          ),
        );
      } catch (error) {
        // Keep the optimistic row; structure will hydrate on next reload after save.
        clientLogger.error("getSongWithSections", error);
      }
    },
    [t.common.errorLoadFailed, toast.error],
  );

  const handleSave = useCallback(async () => {
    const trimmed = title.trim();
    const basePayload = {
      title: trimmed,
      description: description.trim() || undefined,
      sessionDate: sessionDate || undefined,
      venue: venue.trim() || undefined,
      songIds: songs.map((s) => s.songId),
    };

    if (isNew) {
      const parsed = createSetlistWithSongsInputSchema.safeParse(basePayload);
      if (!parsed.success) {
        const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "title");
        if (hasTitleIssue) setTitleError(true);
        else toast.error(t.common.errorCreateFailed);
        return;
      }
      setSaving(true);
      try {
        const result = await createSetlistWithSongs({ data: parsed.data });
        savedSnapshotRef.current = currentSnapshot;
        await router.invalidate();
        navigate({ to: "/setlists/$id", params: { id: result.id }, replace: true });
      } catch (error) {
        clientLogger.error("createSetlist", error);
        toast.error(t.common.errorCreateFailed);
        setSaving(false);
      }
      return;
    }

    const parsed = saveSetlistWithSongsInputSchema.safeParse({
      id: editSetlistId ?? "",
      ...basePayload,
    });
    if (!parsed.success) {
      const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "title");
      if (hasTitleIssue) setTitleError(true);
      else toast.error(t.common.errorSaveFailed);
      return;
    }

    setSaving(true);
    try {
      await saveSetlistWithSongs({ data: parsed.data });
      setSaved(true);
      savedSnapshotRef.current = currentSnapshot;
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      await router.invalidate();
    } catch (error) {
      clientLogger.error("saveSetlistWithSongs", error);
      toast.error(t.common.errorSaveFailed);
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    sessionDate,
    venue,
    songs,
    isNew,
    editSetlistId,
    currentSnapshot,
    navigate,
    router,
    t.common.errorCreateFailed,
    t.common.errorSaveFailed,
    toast.error,
  ]);

  const executeDelete = useCallback(async () => {
    if (!editSetlistId) return;
    try {
      await deleteSetlist({ data: { id: editSetlistId } });
      await router.invalidate();
      navigate({ to: "/setlists" });
    } catch (error) {
      clientLogger.error("deleteSetlist", error);
      toast.error(t.common.errorDeleteFailed);
    }
  }, [editSetlistId, navigate, router, t.common.errorDeleteFailed, toast.error]);

  return {
    title,
    description,
    sessionDate,
    venue,
    titleError,
    songs,
    saving,
    saved,
    isDirty,
    setTitle,
    setDescription,
    setSessionDate,
    setVenue,
    setSongs,
    handleDragEnd,
    handleRemoveSong,
    handlePickerAdd,
    handleSave,
    executeDelete,
  };
}
