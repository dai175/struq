// Web Audio helpers for the perform view.
//
// iOS Safari requires AudioContext to be created or resumed inside a user-gesture
// handler (tap/keypress). Callers must call `unlockAudio()` from such a handler
// before relying on sound — otherwise scheduled oscillators will be silent.

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
}

const STRONG_FREQ = 1800;
const WEAK_FREQ = 1000;
const CLICK_DURATION = 0.05;
const CLICK_PEAK_GAIN = 0.3;

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
  const startAt = c.currentTime + (options.startOffsetSeconds ?? 0);
  const oscillators: OscillatorNode[] = [];

  for (let i = 0; i < beatCount; i++) {
    const when = startAt + i * interval;
    const strong = i % strongBeatEvery === 0;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = strong ? STRONG_FREQ : WEAK_FREQ;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(CLICK_PEAK_GAIN, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + CLICK_DURATION);
    osc.connect(gain).connect(c.destination);
    osc.start(when);
    osc.stop(when + CLICK_DURATION + 0.01);
    oscillators.push(osc);
  }

  return {
    cancel() {
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          // already stopped or still scheduled past cancellation window
        }
      }
    },
  };
}
