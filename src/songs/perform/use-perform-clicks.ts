import { useEffect, useRef } from "react";
import { type ClickScheduleHandle, scheduleClicks } from "@/lib/audio";
import type { ClickSound } from "@/lib/click-voices";
import type { PerformMode } from "@/songs/perform/types";
import { sectionBeats } from "@/songs/perform-utils";
import type { SectionRow } from "@/songs/server-fns";

interface ClickPrefs {
  enabled: boolean;
  volumePercent: number;
  sound: ClickSound;
  accentDownbeat: boolean;
}

export function usePerformClicks(params: {
  mode: PerformMode;
  current: SectionRow | undefined;
  bpm: number | null;
  currentIndex: number;
  prefs: ClickPrefs;
}) {
  const { mode, current, bpm, currentIndex, prefs } = params;
  const { enabled, volumePercent, sound, accentDownbeat } = prefs;

  const clickHandleRef = useRef<ClickScheduleHandle | null>(null);
  const elapsedMsRef = useRef(0);
  const lastSectionRef = useRef(currentIndex);

  // Auto-mode click scheduling — preserves elapsed click position across pause/resume
  // by tracking how long the previous schedule ran and resuming from that offset.
  useEffect(() => {
    clickHandleRef.current?.cancel();
    clickHandleRef.current = null;

    if (lastSectionRef.current !== currentIndex) {
      lastSectionRef.current = currentIndex;
      elapsedMsRef.current = 0;
    }

    if (mode !== "auto" || !enabled || !current || !bpm) return;

    const startedAt = performance.now();
    clickHandleRef.current = scheduleClicks(bpm, sectionBeats(current), {
      elapsedMsAtStart: elapsedMsRef.current,
      volumePercent,
      sound,
      accentDownbeat,
    });
    return () => {
      clickHandleRef.current?.cancel();
      clickHandleRef.current = null;
      elapsedMsRef.current += performance.now() - startedAt;
    };
  }, [mode, enabled, volumePercent, sound, accentDownbeat, current, bpm, currentIndex]);

  // Count-in beats (4 beats before auto starts)
  useEffect(() => {
    if (mode !== "countin" || !enabled || !bpm) return;
    const handle = scheduleClicks(bpm, 4, {
      volumePercent,
      sound,
      accentDownbeat,
    });
    return () => handle.cancel();
  }, [mode, enabled, bpm, volumePercent, sound, accentDownbeat]);
}
