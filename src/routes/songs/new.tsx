import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/new")({
  component: NewSongPage,
});

function NewSongPage() {
  return <div className="p-6">New Song</div>;
}
