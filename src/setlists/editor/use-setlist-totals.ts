import { useMemo } from "react";
import type { SetlistSongItem, SetlistSongSection } from "@/setlists/server-fns";

export function useSetlistTotals(songs: SetlistSongItem[]): {
  totalSongSections: SetlistSongSection[];
  totalMinutes: number;
} {
  return useMemo(() => {
    const sections: SetlistSongSection[] = [];
    let totalSeconds = 0;
    for (const song of songs) {
      if (song.sections.length === 0) continue;
      sections.push(...song.sections);
      if (song.bpm && song.bpm > 0) {
        const bars = song.sections.reduce((sum, s) => sum + s.bars, 0);
        totalSeconds += (bars * 4 * 60) / song.bpm;
      }
    }
    return { totalSongSections: sections, totalMinutes: Math.round(totalSeconds / 60) };
  }, [songs]);
}
