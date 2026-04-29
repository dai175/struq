import { putOfflineSetlist, putOfflineSong } from "@/offline/db";
import { getSetlist } from "@/setlists/server-fns";
import { getSongWithSections } from "@/songs/server-fns";

export async function fetchPerformData(songId: string, setlistId: string | undefined) {
  const [songData, setlistData] = await Promise.all([
    getSongWithSections({ data: { songId } }),
    setlistId ? getSetlist({ data: { setlistId } }) : null,
  ]);
  return { songData, setlistData };
}

export async function persistPerformData(
  songData: Awaited<ReturnType<typeof getSongWithSections>>,
  setlistData: Awaited<ReturnType<typeof getSetlist>>,
) {
  await Promise.all([
    songData ? putOfflineSong(songData.song, songData.sections) : null,
    setlistData ? putOfflineSetlist(setlistData.setlist, setlistData.songs) : null,
  ]);
}

// Refreshes IDB so the next visit serves fresh data. Failures leave the
// existing cache intact for offline reads.
export async function revalidatePerformData(songId: string, setlistId: string | undefined): Promise<void> {
  try {
    const { songData, setlistData } = await fetchPerformData(songId, setlistId);
    await persistPerformData(songData, setlistData);
  } catch {
    // Keep the cache as a stale fallback.
  }
}
