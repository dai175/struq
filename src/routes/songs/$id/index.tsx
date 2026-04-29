import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAuth } from "@/auth/server-fns";
import { getOfflineSong, putOfflineSong } from "@/offline/db";
import { isOffline } from "@/offline/use-online-status";
import { SongEditor } from "@/songs/editor/SongEditor";
import { getSongWithSections } from "@/songs/server-fns";

export const Route = createFileRoute("/songs/$id/")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    let data: Awaited<ReturnType<typeof getSongWithSections>>;
    try {
      data = await getSongWithSections({ data: { songId: params.id } });
    } catch (error) {
      if (isOffline()) {
        const cached = await getOfflineSong(params.id);
        if (cached) return { song: cached.song, sections: cached.sections };
      }
      throw error;
    }
    if (!data) throw redirect({ to: "/songs" });
    return data;
  },
  component: SongEditRoute,
});

function SongEditRoute() {
  const loaderData = Route.useLoaderData();
  const { id } = Route.useParams();
  // Cache on actual mount, not on the loader, so router preload (hover) does
  // not silently fill IDB with entries the user never opened.
  useEffect(() => {
    void putOfflineSong(loaderData.song, loaderData.sections);
  }, [loaderData]);
  return <SongEditor mode="edit" id={id} initial={loaderData} />;
}
