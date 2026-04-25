// Web Audio helpers for the perform view.
//
// iOS Safari requires AudioContext to be created or resumed inside a user-gesture
// handler (tap/keypress). Callers must call `unlockAudio()` from such a handler
// before relying on sound — otherwise scheduled oscillators will be silent.

import { type ClickSound, VOICES } from "./click-voices";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Create or resume the AudioContext. Must be called from a user-gesture handler on iOS. */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === "suspended") void c.resume();
}

export interface ClickScheduleHandle {
  cancel(): void;
}

interface ScheduleClicksOptions {
  /** Seconds from AudioContext.currentTime to delay the first click. Default 0. */
  startOffsetSeconds?: number;
  /** Every Nth beat (0-indexed) is rendered as a strong (higher-pitch) click. Default 4. */
  strongBeatEvery?: number;
  /**
   * Milliseconds already elapsed in the section's playback timeline. Beats whose
   * timeline position is in the past are skipped; remaining beats keep their
   * absolute index so the strong/weak phase stays aligned across pause/resume.
   */
  elapsedMsAtStart?: number;
  /** User-facing click volume on a 0..100 scale. Defaults to 100 (full). */
  volumePercent?: number;
  /** Voice variant to synthesize each beat with. Defaults to "TICK". */
  sound?: ClickSound;
}

const CLICK_PEAK_GAIN = 0.3;

/**
 * Map a 0..100 user-facing volume percent to a 0..CLICK_PEAK_GAIN gain coefficient.
 * Uses a squared curve so the lower half of the slider stays gentle and the
 * upper half scales more aggressively, matching how loudness is perceived.
 */
export function clickVolumeToGain(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent)) / 100;
  return CLICK_PEAK_GAIN * clamped * clamped;
}

/**
 * Schedule `beatCount` clicks at `bpm` tempo starting `startOffsetSeconds` into the future.
 * Returns a handle whose `cancel()` silences any clicks not yet played.
 */
export function scheduleClicks(
  bpm: number,
  beatCount: number,
  options: ScheduleClicksOptions = {},
): ClickScheduleHandle {
  const c = getContext();
  if (!c || beatCount <= 0 || bpm <= 0) return { cancel: () => {} };

  const strongBeatEvery = options.strongBeatEvery ?? 4;
  const interval = 60 / bpm;
  const elapsedSec = (options.elapsedMsAtStart ?? 0) / 1000;
  const startAt = c.currentTime + (options.startOffsetSeconds ?? 0);
  const peakGain = clickVolumeToGain(options.volumePercent ?? 100);
  if (peakGain <= 0) return { cancel: () => {} };
  const voice = VOICES[options.sound ?? "TICK"];
  const sources: AudioScheduledSourceNode[] = [];

  for (let i = 0; i < beatCount; i++) {
    const beatTimelineSec = i * interval;
    if (beatTimelineSec < elapsedSec - 1e-6) continue;
    const when = startAt + (beatTimelineSec - elapsedSec);
    const strong = i % strongBeatEvery === 0;
    sources.push(...voice(c, when, strong, peakGain));
  }

  return {
    cancel() {
      for (const src of sources) {
        try {
          src.stop();
        } catch {
          // already stopped or still scheduled past cancellation window
        }
      }
    },
  };
}
