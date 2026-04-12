import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setlists/")({
  component: SetlistsPage,
});

function SetlistsPage() {
  return <div className="p-6">Setlists</div>;
}
