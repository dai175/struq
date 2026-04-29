import { useState } from "react";
import { clientLogger } from "@/lib/client-logger";
import { getSongWithSections } from "@/songs/server-fns";
import { putOfflineSong } from "./db";
import { useCachedSongs } from "./use-cached";

interface BulkDownloadButtonProps {
  songIds: string[];
}

// Iterates ids serially so the LED pulse + N/M counter advance one song at a
// time; per-song payloads are small enough that parallelising would mainly
// blur the feedback.
export function BulkDownloadButton({ songIds }: BulkDownloadButtonProps) {
  const cached = useCachedSongs();
  const total = songIds.length;
  const cachedCount = songIds.reduce((n, id) => (cached.has(id) ? n + 1 : n), 0);
  const allCached = total > 0 && cachedCount === total;

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (total === 0) return null;

  async function handleClick() {
    setDownloading(true);
    setProgress(0);
    let done = 0;
    for (const id of songIds) {
      try {
        const data = await getSongWithSections({ data: { songId: id } });
        if (data) await putOfflineSong(data.song, data.sections);
      } catch (error) {
        clientLogger.error("bulkDownloadSong", error);
      }
      done += 1;
      setProgress(done);
    }
    setDownloading(false);
  }

  const label = downloading
    ? `CACHING ${progress}/${total}`
    : allCached
      ? `CACHED · ${cachedCount}/${total}`
      : `DOWNLOAD · ${cachedCount}/${total}`;

  const disabled = downloading || allCached;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex items-center gap-2"
      style={{
        padding: "6px 12px",
        border: "1px solid var(--color-line)",
        background: disabled ? "transparent" : "var(--color-bg-elevated)",
        color: allCached ? "var(--color-accent)" : "var(--color-text)",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "0.22em",
        fontWeight: 600,
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        opacity: allCached ? 0.85 : 1,
        borderRadius: 2,
      }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{
          background: allCached ? "var(--color-accent)" : "var(--color-dim-2)",
          animation: downloading ? "led-pulse 0.6s ease-in-out infinite alternate" : undefined,
        }}
      />
      {label}
    </button>
  );
}
