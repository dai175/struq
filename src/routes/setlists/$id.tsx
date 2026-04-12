import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setlists/$id")({
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Setlist: {id}</div>;
}
