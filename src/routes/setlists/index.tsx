import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/setlists/")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetlistsPage,
});

function SetlistsPage() {
  return <div className="p-6">Setlists</div>;
}
