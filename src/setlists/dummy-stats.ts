import type { SectionType } from "@/i18n/types";

// Dummy per-song structure/meta used by the PC setlist detail view until
// real data (BPM / key / sections) is joined into getSetlist. Values are
// deterministic per songId so re-renders stay stable.

export interface DummySongMeta {
  bpm: number;
  key: string;
  sections: { id: string; type: SectionType; bars: number }[];
}

export interface DummySetlistStats {
  totalSections: number;
  totalBars: number;
  estDurationMin: number;
  avgBpm: number;
}

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return h;
}

const KEYS = ["C", "G", "D", "A", "E", "F", "Bm", "Am", "Em", "Dm"];

const SECTION_TEMPLATE: { type: SectionType; bars: number }[] = [
  { type: "intro", bars: 4 },
  { type: "a", bars: 8 },
  { type: "b", bars: 8 },
  { type: "chorus", bars: 8 },
  { type: "a", bars: 8 },
  { type: "chorus", bars: 8 },
  { type: "bridge", bars: 4 },
  { type: "solo", bars: 8 },
  { type: "chorus", bars: 8 },
  { type: "outro", bars: 4 },
];

export function dummySongMeta(songId: string): DummySongMeta {
  const h = hash(songId);
  const bpm = 70 + (h % 60);
  const key = KEYS[h % KEYS.length];
  const sectionCount = 5 + (h % 6);
  const sections = SECTION_TEMPLATE.slice(0, sectionCount).map((s, i) => ({
    id: `${songId}-${i}`,
    type: s.type,
    bars: s.bars,
  }));
  return { bpm, key, sections };
}

export function dummySetlistStats(metas: DummySongMeta[]): DummySetlistStats {
  const totalSections = metas.reduce((n, m) => n + m.sections.length, 0);
  const totalBars = metas.reduce((n, m) => n + m.sections.reduce((b, s) => b + s.bars, 0), 0);
  const sumBpm = metas.reduce((n, m) => n + m.bpm, 0);
  const avgBpm = metas.length > 0 ? Math.round(sumBpm / metas.length) : 0;
  // 4 beats per bar; duration(min) = totalBars * 4 / bpm.
  const estDurationMin = avgBpm > 0 ? Math.round((totalBars * 4) / avgBpm) : 0;
  return { totalSections, totalBars, estDurationMin, avgBpm };
}
