import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLoadMore } from "@/lib/use-load-more";
import { listSetlists, type SetlistWithSongCount } from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconCal, IconPlus, IconSearch } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

interface SetlistsSearch {
  q?: string;
}

export const Route = createFileRoute("/setlists")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): SetlistsSearch => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => listSetlists({ data: { query: deps.q } }),
  component: SetlistsLayout,
});

function SetlistsLayout() {
  return (
    <div className="lg:flex lg:min-h-screen" style={{ background: "var(--color-ink)", color: "var(--color-text)" }}>
      <SetlistsPcListColumn />
      <main className="min-w-0 lg:flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function SetlistsPcListColumn() {
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  const params = useParams({ strict: false }) as { id?: string };
  const activeId = params.id;
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  // Sync local input with URL query synchronously during render when another
  // input (mobile header) navigates — same boundKey pattern as Songs.
  const queryKey = search.q ?? "";
  const [boundKey, setBoundKey] = useState(queryKey);
  if (boundKey !== queryKey) {
    setBoundKey(queryKey);
    setInput(queryKey);
  }

  const {
    items,
    hasMore,
    loading: loadingMore,
    loadMore,
  } = useLoadMore({
    initialItems: initial.items,
    initialHasMore: initial.hasMore,
    resetKey: queryKey,
    fetchMore: (offset) => listSetlists({ data: { offset, query: search.q } }),
  });

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    if (input !== debouncedInput) return;
    navigate({ to: "/setlists", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, input, search.q, navigate]);

  function handleCreate() {
    navigate({ to: "/setlists/new" });
  }

  async function handleLoadMore() {
    try {
      await loadMore();
    } catch (error) {
      clientLogger.error("loadMoreSetlists", error);
      toast.error(t.common.errorLoadFailed);
    }
  }

  const isSearching = !!search.q;

  return (
    <aside
      className="hidden lg:flex lg:flex-col"
      style={{
        width: 360,
        flexShrink: 0,
        borderRight: "1px solid var(--color-line)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="flex items-center"
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--color-line)",
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{t.nav.setlists}</div>
          <div style={{ marginTop: 2 }}>
            <MetaTag size={9}>
              {String(items.length).padStart(2, "0")}
              {hasMore ? "+" : ""} {(isSearching ? t.setlist.shown : t.setlist.total).toUpperCase()}
            </MetaTag>
          </div>
        </div>
        <ConsoleBtn tone="white" onClick={handleCreate}>
          <IconPlus size={10} />
          {t.common.new.toUpperCase()}
        </ConsoleBtn>
      </div>

      <div
        className="flex items-center"
        style={{
          padding: "10px 22px",
          borderBottom: "1px solid var(--color-line)",
          gap: 8,
        }}
      >
        <div style={{ color: "var(--color-dim)", display: "flex" }}>
          <IconSearch size={14} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.setlist.searchPlaceholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-text)",
            fontSize: 13,
            fontFamily: "var(--font-sans)",
          }}
        />
        {input ? (
          <button
            type="button"
            onClick={() => setInput("")}
            aria-label={t.setlist.searchClear}
            style={{
              color: "var(--color-dim-2)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              fontSize: 14,
            }}
          >
            ×
          </button>
        ) : (
          <MetaTag size={9}>A–Z</MetaTag>
        )}
      </div>

      <ul className="overflow-auto" style={{ flex: 1 }}>
        {items.map((setlist, i) => (
          <SetlistsPcListRow key={setlist.id} setlist={setlist} index={i} active={setlist.id === activeId} />
        ))}
        {hasMore && (
          <li className="flex justify-center" style={{ padding: "16px 22px" }}>
            <ConsoleBtn onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? t.common.loading : t.common.loadMore}
            </ConsoleBtn>
          </li>
        )}
      </ul>
    </aside>
  );
}

function SetlistsPcListRow({
  setlist,
  index,
  active,
}: {
  setlist: SetlistWithSongCount;
  index: number;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to="/setlists/$id"
        params={{ id: setlist.id }}
        search={(prev) => prev}
        style={{
          display: "block",
          padding: "14px 22px",
          borderBottom: "1px solid var(--color-line)",
          background: active ? "rgba(255,255,255,0.04)" : "transparent",
          borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
          marginLeft: active ? -2 : 0,
          color: "var(--color-text)",
          textDecoration: "none",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--color-dim-2)",
              paddingTop: 3,
              width: 18,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="truncate"
              style={{
                fontSize: 14,
                fontWeight: active ? 700 : 600,
                color: "var(--color-text)",
              }}
            >
              {setlist.title}
            </div>
            <div
              className="flex flex-wrap"
              style={{
                gap: "4px 10px",
                marginTop: 5,
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
              }}
            >
              {setlist.sessionDate && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <IconCal size={10} />
                  {setlist.sessionDate}
                </span>
              )}
              <span style={{ letterSpacing: "0.18em" }}>{String(setlist.songCount).padStart(2, "0")} SONGS</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
