import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { unlockAudio } from "@/lib/audio";
import type { SetlistSongItem } from "@/setlists/server-fns";
import { isRunningMode, type PerformMode } from "@/songs/perform/types";

export function usePerformControls(params: {
  songId: string;
  setlistId: string | undefined;
  total: number;
  setlistSongs: SetlistSongItem[];
  countIn: boolean;
  preRollBars: number;
}) {
  const { songId, setlistId, total, setlistSongs, countIn, preRollBars } = params;
  const navigate = useNavigate();

  const [mode, setMode] = useState<PerformMode>("selecting");
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipedRef = useRef(false);

  const currentSongIdx = setlistSongs.findIndex((s) => s.songId === songId);
  const isSetlistMode = !!setlistId && currentSongIdx >= 0;
  const hasNextSong = isSetlistMode && currentSongIdx < setlistSongs.length - 1;
  const hasPrevSong = isSetlistMode && currentSongIdx > 0;
  const isEnded = currentIndex >= total;

  const navigateToSong = useCallback(
    (target: SetlistSongItem) => {
      navigate({
        to: "/songs/$id/perform",
        params: { id: target.songId },
        search: { setlistId },
      });
    },
    [navigate, setlistId],
  );

  const advanceSection = useCallback(() => {
    if (total === 0 || currentIndex >= total) return;
    if (currentIndex >= total - 1) {
      if (isSetlistMode && hasNextSong) {
        navigateToSong(setlistSongs[currentSongIdx + 1]);
      } else {
        setCurrentIndex(total);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [total, currentIndex, isSetlistMode, hasNextSong, navigateToSong, setlistSongs, currentSongIdx]);

  const handleBack = useCallback(() => {
    setCurrentIndex((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
    setMode((m) => (isRunningMode(m) ? "paused" : m));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setMode((m) => (isRunningMode(m) ? "paused" : m));
  }, []);

  const goExit = useCallback(() => {
    if (setlistId) {
      navigate({ to: "/setlists/$id", params: { id: setlistId } });
    } else {
      navigate({ to: "/songs/$id", params: { id: songId } });
    }
  }, [navigate, setlistId, songId]);

  const handleSelectManual = useCallback(() => setMode("manual"), []);

  const handleSelectAuto = useCallback(() => {
    unlockAudio();
    if (preRollBars > 0) {
      setMode("preroll");
    } else if (countIn) {
      setMode("countin");
    } else {
      setMode("auto");
    }
  }, [preRollBars, countIn]);

  const handlePreRollComplete = useCallback(() => {
    setMode(countIn ? "countin" : "auto");
  }, [countIn]);

  const handleCountInComplete = useCallback(() => setMode("auto"), []);

  const handlePrimaryAction = useCallback(() => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    switch (mode) {
      case "selecting":
        return;
      case "manual":
        advanceSection();
        return;
      case "preroll":
      case "countin":
      case "auto":
        setMode("paused");
        return;
      case "paused":
        setMode("auto");
        return;
    }
  }, [mode, advanceSection]);

  const handleTouchSwipe = useCallback(
    (dx: number) => {
      if (mode === "selecting" || !isSetlistMode) return;
      if (dx > 0 && hasPrevSong) {
        swipedRef.current = true;
        navigateToSong(setlistSongs[currentSongIdx - 1]);
      } else if (dx < 0 && hasNextSong) {
        swipedRef.current = true;
        navigateToSong(setlistSongs[currentSongIdx + 1]);
      }
    },
    [mode, isSetlistMode, hasNextSong, hasPrevSong, navigateToSong, setlistSongs, currentSongIdx],
  );

  return {
    mode,
    currentIndex,
    isEnded,
    isSetlistMode,
    hasNextSong,
    hasPrevSong,
    currentSongIdx,
    advanceSection,
    handleBack,
    handleReset,
    goExit,
    handleSelectManual,
    handleSelectAuto,
    handlePreRollComplete,
    handleCountInComplete,
    handlePrimaryAction,
    handleTouchSwipe,
  };
}
