import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/$id/perform")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: PerformPage,
});

function PerformPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-surface-dark text-text-on-dark p-6">
      Perform: {id}
    </div>
  );
}
