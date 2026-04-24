import { createFileRoute, Link, Outlet, useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLoadMore } from "@/lib/use-load-more";
import { listSongs, type SectionRow, type SongRow } from "@/songs/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconPlus, IconSearch } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";

type SongsSearch = { q?: string };

export const Route = createFileRoute("/songs")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): SongsSearch => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => listSongs({ data: { query: deps.q } }),
  component: SongsLayout,
});

function SongsLayout() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";
  // Perform is a fullscreen modal mode — skip the PC library chrome there.
  if (currentPath.endsWith("/perform")) return <Outlet />;

  return (
    <div className="lg:flex lg:min-h-screen" style={{ background: "var(--color-ink)", color: "var(--color-text)" }}>
      <SongsPcLibraryColumn />
      <main className="min-w-0 lg:flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function SongsPcLibraryColumn() {
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  const params = useParams({ strict: false }) as { id?: string };
  const activeId = params.id;
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  // Sync local input with the URL query synchronously during render when
  // another input (mobile header mounts alongside this one) navigates.
  // A useEffect-based sync would leave `input` stale during the same
  // render's navigate effect, triggering a revert-navigate loop.
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
    fetchMore: (offset) => listSongs({ data: { offset, query: search.q } }),
  });

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    // Skip while the debounce is still catching up to the latest input —
    // otherwise we'd navigate with a stale value (e.g. revert an in-flight
    // search just because our local debounce hasn't settled yet).
    if (input !== debouncedInput) return;
    navigate({ to: "/songs", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, input, search.q, navigate]);

  function handleCreate() {
    navigate({ to: "/songs/new" });
  }

  const isSearching = !!search.q;

  async function handleLoadMore() {
    try {
      await loadMore();
    } catch (error) {
      clientLogger.error("loadMoreSongs", error);
      toast.error(t.common.errorLoadFailed);
    }
  }

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
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{t.nav.songs}</div>
          <div style={{ marginTop: 2 }}>
            <MetaTag size={9}>
              {String(items.length).padStart(2, "0")}
              {hasMore ? "+" : ""} {(isSearching ? t.song.shown : t.song.total).toUpperCase()}
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
          placeholder={t.song.searchPlaceholder}
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
            aria-label={t.song.searchClear}
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
        {items.map((it, i) => (
          <SongsPcLibraryRow
            key={it.song.id}
            song={it.song}
            sections={it.sections}
            index={i}
            active={it.song.id === activeId}
          />
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

function SongsPcLibraryRow({
  song,
  sections,
  index,
  active,
}: {
  song: SongRow;
  sections: SectionRow[];
  index: number;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to="/songs/$id"
        params={{ id: song.id }}
        search={(prev) => prev}
        style={{
          display: "block",
          padding: "12px 22px",
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
              paddingTop: 4,
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
              {song.title}
            </div>
            <div
              className="flex"
              style={{
                gap: 10,
                marginTop: 3,
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
              }}
            >
              {song.bpm != null && <span>{song.bpm}BPM</span>}
              {song.key && <span>{song.key}</span>}
              <span>{String(sections.length).padStart(2, "0")}SEC</span>
            </div>
            {sections.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <StructureBar sections={sections} height={3} gap={1} />
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
