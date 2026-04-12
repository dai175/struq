import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/$id/perform")({
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
