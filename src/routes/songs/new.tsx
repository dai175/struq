import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";
import { SongEditor } from "@/songs/editor/SongEditor";

export const Route = createFileRoute("/songs/new")({
  beforeLoad: requireAuth,
  component: NewSongRoute,
});

function NewSongRoute() {
  return <SongEditor mode="new" />;
}
