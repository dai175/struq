import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/new")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: NewSongPage,
});

function NewSongPage() {
  return <div className="p-6">New Song</div>;
}
