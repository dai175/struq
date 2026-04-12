import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";

export const Route = createFileRoute("/songs/new")({
  beforeLoad: requireAuth,
  component: NewSongPage,
});

function NewSongPage() {
  return <div className="p-6">New Song</div>;
}
