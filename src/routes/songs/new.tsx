import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { createSongInputSchema } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import { isValidUrl } from "@/lib/validation";
import { createSong } from "@/songs/server-fns";

export const Route = createFileRoute("/songs/new")({
  beforeLoad: requireAuth,
  component: NewSongPage,
});

function NewSongPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }

    const trimmedUrl = referenceUrl.trim();
    if (trimmedUrl && !isValidUrl(trimmedUrl)) {
      setUrlError(true);
      return;
    }

    const parsedBpm = bpm ? parseInt(bpm, 10) : undefined;
    const payload = {
      title: trimmed,
      artist: artist.trim() || undefined,
      bpm: parsedBpm && parsedBpm > 0 ? parsedBpm : undefined,
      key: key.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
    };
    const parsed = createSongInputSchema.safeParse(payload);
    if (!parsed.success) {
      const hasTitleIssue = parsed.error.issues.some((issue) => issue.path[0] === "title");
      const hasUrlIssue = parsed.error.issues.some((issue) => issue.path[0] === "referenceUrl");
      if (hasTitleIssue) setTitleError(true);
      if (hasUrlIssue) setUrlError(true);
      return;
    }

    setSaving(true);
    try {
      const result = await createSong({
        data: parsed.data,
      });
      navigate({ to: "/songs/$id", params: { id: result.id } });
    } catch (error) {
      clientLogger.error("createSong", error);
      toast.error(t.common.errorCreateFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/songs"
          aria-label={t.common.back}
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-muted"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">{t.nav.newSong}</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="song-title" className="mb-1 block text-sm text-text-secondary">
            {t.song.title} *
          </label>
          <input
            id="song-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            aria-describedby={titleError ? "song-title-error" : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              titleError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {titleError && (
            <p id="song-title-error" className="mt-1 text-xs text-red-500">
              {t.song.titleRequired}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="song-artist" className="mb-1 block text-sm text-text-secondary">
            {t.song.artist}
          </label>
          <input
            id="song-artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="song-bpm" className="mb-1 block text-sm text-text-secondary">
              {t.song.bpm}
            </label>
            <input
              id="song-bpm"
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="120"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 font-mono text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="song-key" className="mb-1 block text-sm text-text-secondary">
              {t.song.key}
            </label>
            <input
              id="song-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Am"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="song-ref-url" className="mb-1 block text-sm text-text-secondary">
            {t.song.referenceUrl}
          </label>
          <input
            id="song-ref-url"
            type="url"
            value={referenceUrl}
            onChange={(e) => {
              setReferenceUrl(e.target.value);
              if (urlError) setUrlError(false);
            }}
            placeholder="https://..."
            aria-describedby={urlError ? "song-ref-url-error" : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              urlError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {urlError && (
            <p id="song-ref-url-error" className="mt-1 text-xs text-red-500">
              {t.song.invalidUrl}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-8 w-full rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
      >
        {saving ? t.common.loading : t.common.save}
      </button>
    </div>
  );
}
