import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { listSongsForPicker } from "@/setlists/server-fns";

export type PickerSong = { id: string; title: string; artist: string | null };

export function useSongPicker(params: { editSetlistId: string | null; selectedSongIds: string[] }) {
  const { editSetlistId, selectedSongIds } = params;
  const { t } = useI18n();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const debouncedInput = useDebouncedValue(input, 300);
  const [items, setItems] = useState<PickerSong[]>([]);
  const [loading, setLoading] = useState(false);
  const latestQueryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const query = debouncedInput.trim() || undefined;
    latestQueryRef.current = query;
    setLoading(true);
    listSongsForPicker({ data: { setlistId: editSetlistId ?? undefined, query } })
      .then((result) => {
        if (latestQueryRef.current !== query) return;
        setItems(result);
      })
      .catch((error) => {
        if (latestQueryRef.current !== query) return;
        clientLogger.error("listSongsForPicker", error);
        setItems([]);
        toast.error(t.common.errorLoadFailed);
      })
      .finally(() => {
        if (latestQueryRef.current !== query) return;
        setLoading(false);
      });
  }, [open, editSetlistId, debouncedInput, t.common.errorLoadFailed, toast.error]);

  // Server-side NOT IN can't see local-only edits; also dedupe client-side.
  const availableSongs = useMemo(() => {
    const existingIds = new Set(selectedSongIds);
    return items.filter((s) => !existingIds.has(s.id));
  }, [items, selectedSongIds]);

  const close = useCallback(() => {
    setOpen(false);
    setInput("");
  }, []);

  return {
    open,
    input,
    availableSongs,
    loading,
    setInput,
    setOpen,
    close,
  };
}
