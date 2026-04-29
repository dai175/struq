import type { SectionData } from "@/songs/components/SectionRow";
import type { SectionRow as SectionDbRow, SongRow } from "@/songs/server-fns";

export function toSectionData(s: SectionDbRow): SectionData {
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

export function buildLoadedSnapshot(data: { song: SongRow; sections: SectionDbRow[] }): string {
  const bpm = data.song.bpm;
  return JSON.stringify({
    title: data.song.title.trim(),
    artist: (data.song.artist ?? "").trim(),
    bpm: bpm != null && bpm > 0 ? bpm : null,
    key: (data.song.key ?? "").trim(),
    referenceUrl: (data.song.referenceUrl ?? "").trim(),
    sections: data.sections.map((s) => [s.type, s.label, s.bars, s.extraBeats, s.chordProgression, s.memo]),
  });
}

export function buildEditingSnapshot(state: {
  title: string;
  artist: string;
  bpm: string;
  key: string;
  referenceUrl: string;
  sections: SectionData[];
}): string {
  const parsedBpm = state.bpm ? Number.parseInt(state.bpm, 10) : undefined;
  return JSON.stringify({
    title: state.title.trim(),
    artist: state.artist.trim(),
    bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : null,
    key: state.key.trim(),
    referenceUrl: state.referenceUrl.trim(),
    sections: state.sections.map((s) => [s.type, s.label, s.bars, s.extraBeats, s.chordProgression, s.memo]),
  });
}
