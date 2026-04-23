import { createFileRoute, Link, useLoaderData, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmModal } from "@/lib/confirm-modal";
import { useToast } from "@/lib/toast";
import { deleteSetlist, listSetlists, type SetlistWithSongCount } from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconCal, IconPin, IconPlus, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

export const Route = createFileRoute("/setlists/")({
  component: SetlistsPage,
});

function SetlistsPage() {
  const initial = useLoaderData({ from: "/setlists" });
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const navigate = useNavigate();

  const [setlists, setSetlists] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleCreate() {
    navigate({ to: "/setlists/new" });
  }

  async function executeDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      await deleteSetlist({ data: { id } });
      setSetlists((prev) => prev.filter((item) => item.id !== id));
      router.invalidate();
    } catch (error) {
      clientLogger.error("deleteSetlist", error);
      toast.error(t.common.errorDeleteFailed);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const next = await listSetlists({ data: { offset: setlists.length } });
      setSetlists((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    } catch (error) {
      clientLogger.error("loadMoreSetlists", error);
      toast.error(t.common.errorLoadFailed);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* PC (≥lg): the list lives in the layout sidebar. Render a hint pane here
          pointing to the sidebar so the master/detail view isn't visually empty. */}
      <div className="hidden min-h-screen lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <MetaTag>{setlists.length === 0 ? "NO SETLISTS" : "SELECT A SETLIST"}</MetaTag>
          <div className="mt-2">
            <ConsoleBtn tone="accent" onClick={handleCreate}>
              <IconPlus size={10} />
              {t.setlist.newSetlist.toUpperCase()}
            </ConsoleBtn>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pt-6 pb-8 lg:hidden">
        <header className="flex items-end justify-between gap-3 pb-5">
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              {t.nav.setlists}
            </h1>
            <div className="mt-1.5">
              <MetaTag>{String(setlists.length).padStart(2, "0")} ACTIVE</MetaTag>
            </div>
          </div>
          <ConsoleBtn tone="white" onClick={handleCreate}>
            <IconPlus size={10} />
            {t.common.new.toUpperCase()}
          </ConsoleBtn>
        </header>

        <div
          style={{
            borderTop: "1px solid var(--color-line)",
          }}
        >
          {setlists.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center" style={{ gap: 14 }}>
              <MetaTag>NO SETLISTS</MetaTag>
              <div className="mt-2">
                <ConsoleBtn tone="accent" onClick={handleCreate}>
                  <IconPlus size={10} />
                  {t.setlist.newSetlist.toUpperCase()}
                </ConsoleBtn>
              </div>
            </div>
          ) : (
            <>
              <ul>
                {setlists.map((setlist, index) => (
                  <SetlistRow
                    key={setlist.id}
                    setlist={setlist}
                    index={index}
                    deleting={deletingId === setlist.id}
                    onDelete={() => setPendingDeleteId(setlist.id)}
                  />
                ))}
              </ul>
              {hasMore && (
                <div className="flex justify-center py-6">
                  <ConsoleBtn onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? t.common.loading : t.common.loadMore}
                  </ConsoleBtn>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        message={t.setlist.confirmDelete}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={executeDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

function SetlistRow({
  setlist,
  index,
  deleting,
  onDelete,
}: {
  setlist: SetlistWithSongCount;
  index: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  return (
    <li
      className="grid items-center gap-3"
      style={{
        gridTemplateColumns: "36px 1fr auto 32px",
        padding: "16px 4px",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-dim-2)",
          letterSpacing: "0.08em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link to="/setlists/$id" params={{ id: setlist.id }} className="min-w-0 flex-1">
        <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
          {setlist.title}
        </p>
        <div
          className="mt-1.5 flex flex-wrap items-center"
          style={{
            gap: "4px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--color-dim-2)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <span>{String(setlist.songCount).padStart(2, "0")} SONGS</span>
          {setlist.sessionDate && (
            <span className="flex items-center gap-1">
              <IconCal size={11} />
              {setlist.sessionDate}
            </span>
          )}
          {setlist.venue && (
            <span className="flex items-center gap-1 truncate">
              <IconPin size={11} />
              {setlist.venue}
            </span>
          )}
        </div>
      </Link>
      <MetaTag size={9}>{String(setlist.songCount).padStart(2, "0")}</MetaTag>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={t.common.delete}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-dim-2)",
          background: "transparent",
          border: "none",
          cursor: deleting ? "not-allowed" : "pointer",
          opacity: deleting ? 0.4 : 1,
        }}
      >
        <IconTrash size={16} />
      </button>
    </li>
  );
}
