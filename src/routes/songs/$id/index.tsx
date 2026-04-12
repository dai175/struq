import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/$id/")({
  component: SongEditPage,
});

function SongEditPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Song: {id}</div>;
}
