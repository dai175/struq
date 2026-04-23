import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";
import { SetlistEditor } from "./$id";

export const Route = createFileRoute("/setlists/new")({
  beforeLoad: requireAuth,
  component: NewSetlistRoute,
});

function NewSetlistRoute() {
  return <SetlistEditor mode="new" />;
}
