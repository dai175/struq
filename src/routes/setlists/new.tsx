import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { createSetlist } from "@/setlists/server-fns";

export const Route = createFileRoute("/setlists/new")({
  beforeLoad: requireAuth,
  component: NewSetlistPage,
});

function NewSetlistPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [venue, setVenue] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }

    setSaving(true);
    try {
      const result = await createSetlist({
        data: {
          title: trimmed,
          description: description.trim() || undefined,
          sessionDate: sessionDate || undefined,
          venue: venue.trim() || undefined,
        },
      });
      navigate({ to: "/setlists/$id", params: { id: result.id } });
    } catch {
      alert(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/setlists"
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-muted"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">{t.setlist.newSetlist}</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">{t.setlist.title} *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(false);
            }}
            className={`w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none ${
              titleError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-400"
            }`}
            autoFocus
          />
          {titleError && <p className="mt-1 text-xs text-red-500">{t.setlist.titleRequired}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-secondary">{t.setlist.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">{t.setlist.sessionDate}</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">{t.setlist.venue}</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
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
