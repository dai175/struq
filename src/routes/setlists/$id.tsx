import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAuth } from "@/auth/server-fns";
import { getOfflineSetlist, putOfflineSetlist } from "@/offline/db";
import { isOffline } from "@/offline/use-online-status";
import { SetlistEditor } from "@/setlists/editor/SetlistEditor";
import { getSetlist } from "@/setlists/server-fns";

export const Route = createFileRoute("/setlists/$id")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    let data: Awaited<ReturnType<typeof getSetlist>>;
    try {
      data = await getSetlist({ data: { setlistId: params.id } });
    } catch (error) {
      if (isOffline()) {
        const cached = await getOfflineSetlist(params.id);
        if (cached) return { setlist: cached.setlist, songs: cached.songs };
      }
      throw error;
    }
    if (!data) throw redirect({ to: "/setlists" });
    return data;
  },
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  // Cache on actual mount, not on the loader, so router preload (hover) does
  // not silently fill IDB with entries the user never opened.
  useEffect(() => {
    void putOfflineSetlist(data.setlist, data.songs);
  }, [data]);
  return <SetlistEditor key={id} mode="edit" setlistId={id} data={data} />;
}
