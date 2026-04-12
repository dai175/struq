import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";

export const Route = createFileRoute("/setlists/$id")({
  beforeLoad: requireAuth,
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Setlist: {id}</div>;
}
