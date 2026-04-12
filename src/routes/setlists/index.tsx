import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";

export const Route = createFileRoute("/setlists/")({
  beforeLoad: requireAuth,
  component: SetlistsPage,
});

function SetlistsPage() {
  return <div className="p-6">Setlists</div>;
}
