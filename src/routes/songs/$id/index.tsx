import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/$id/")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: SongEditPage,
});

function SongEditPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Song: {id}</div>;
}
