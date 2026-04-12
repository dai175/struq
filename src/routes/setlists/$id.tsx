import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/setlists/$id")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const { id } = Route.useParams();
  return <div className="p-6">Setlist: {id}</div>;
}
