import { createFileRoute, Link, Outlet, useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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

  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    navigate({ to: "/songs", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, search.q, navigate]);

  function handleCreate() {
    navigate({ to: "/songs/new" });
  }

  const items = initial.items;
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{t.nav.songs}</div>
          <div style={{ marginTop: 2 }}>
            <MetaTag size={9}>
              {String(items.length).padStart(2, "0")} {isSearching ? "SHOWN" : "TOTAL"}
            </MetaTag>
          </div>
        </div>
        <ConsoleBtn tone="white" onClick={handleCreate}>
          <IconPlus size={10} />
          NEW
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
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.song.searchPlaceholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
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
        {items.length === 0 ? (
          <li style={{ padding: "20px 22px", color: "var(--color-dim)", fontSize: 13 }}>
            {isSearching ? t.song.searchNoResults : t.song.noSongs}
          </li>
        ) : (
          items.map((it, i) => (
            <SongsPcLibraryRow
              key={it.song.id}
              song={it.song}
              sections={it.sections}
              index={i}
              active={it.song.id === activeId}
            />
          ))
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
              fontSize: 9,
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
                fontSize: 13,
                fontWeight: 600,
                color: active ? "#fff" : "var(--color-text)",
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
