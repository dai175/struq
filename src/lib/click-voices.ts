// Voice synthesizers for the metronome click track.
//
// Each voice schedules a single audible "hit" at `when`, returning the source
// nodes so the parent scheduler can cancel un-played hits when the user
// pauses, advances, or changes settings.
//
// Voices own their own envelope and stop time; callers only need to track
// the returned sources for cancellation.

export const CLICK_SOUNDS = ["TICK", "BEEP", "SNAP", "RIM"] as const;
export type ClickSound = (typeof CLICK_SOUNDS)[number];

export type VoiceScheduler = (
  ctx: AudioContext,
  when: number,
  strong: boolean,
  peakGain: number,
) => AudioScheduledSourceNode[];

let cachedNoise: { buffer: AudioBuffer; sampleRate: number } | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoise && cachedNoise.sampleRate === ctx.sampleRate) {
    return cachedNoise.buffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  cachedNoise = { buffer, sampleRate: ctx.sampleRate };
  return buffer;
}

function applyClickEnvelope(gain: GainNode, when: number, peak: number, attackSec: number, decaySec: number): void {
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + attackSec);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decaySec);
}

const scheduleTick: VoiceScheduler = (ctx, when, strong, peakGain) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = strong ? 1800 : 1000;
  applyClickEnvelope(gain, when, peakGain, 0.001, 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.06);
  return [osc];
};

const scheduleBeep: VoiceScheduler = (ctx, when, strong, peakGain) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = strong ? 2600 : 1800;
  applyClickEnvelope(gain, when, peakGain, 0.0008, 0.07);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.08);
  return [osc];
};

const scheduleSnap: VoiceScheduler = (ctx, when, strong, peakGain) => {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = strong ? 3500 : 2500;
  filter.Q.value = 4;
  const gain = ctx.createGain();
  applyClickEnvelope(gain, when, peakGain * 1.4, 0.001, 0.04);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(when);
  noise.stop(when + 0.05);
  return [noise];
};

const scheduleRim: VoiceScheduler = (ctx, when, strong, peakGain) => {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = strong ? 1600 : 1100;
  noiseFilter.Q.value = 2.5;
  const noiseGain = ctx.createGain();
  applyClickEnvelope(noiseGain, when, peakGain * 0.95, 0.001, 0.05);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.value = strong ? 280 : 210;
  const bodyGain = ctx.createGain();
  applyClickEnvelope(bodyGain, when, peakGain * 0.55, 0.002, 0.06);
  body.connect(bodyGain).connect(ctx.destination);

  noise.start(when);
  noise.stop(when + 0.07);
  body.start(when);
  body.stop(when + 0.07);
  return [noise, body];
};

export const VOICES: Record<ClickSound, VoiceScheduler> = {
  TICK: scheduleTick,
  BEEP: scheduleBeep,
  SNAP: scheduleSnap,
  RIM: scheduleRim,
};
