import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";

export const Route = createFileRoute("/songs/$id/")({
  beforeLoad: requireAuth,
  component: SongEditPage,
});

function SongEditPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Song: {id}</div>;
}
