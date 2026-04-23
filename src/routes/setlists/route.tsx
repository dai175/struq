import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { requireAuth } from "@/auth/server-fns";
import { useI18n } from "@/i18n";
import { listSetlists, type SetlistWithSongCount } from "@/setlists/server-fns";
import { IconCal } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

export const Route = createFileRoute("/setlists")({
  beforeLoad: requireAuth,
  loader: () => listSetlists({ data: {} }),
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
  const { items } = Route.useLoaderData();
  // strict:false lets this hook work from the layout route even when the
  // active child is `/setlists/` (no id param).
  const params = useParams({ strict: false }) as { id?: string };
  const activeId = params.id;
  const { t } = useI18n();

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
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{t.nav.setlists}</div>
        <div style={{ marginTop: 2 }}>
          <MetaTag size={9}>{String(items.length).padStart(2, "0")} ACTIVE</MetaTag>
        </div>
      </div>

      <ul className="overflow-auto" style={{ flex: 1 }}>
        {items.map((setlist, i) => (
          <SetlistsPcListRow key={setlist.id} setlist={setlist} index={i} active={setlist.id === activeId} />
        ))}
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
        style={{
          display: "block",
          padding: "14px 22px",
          borderBottom: "1px solid var(--color-line)",
          background: active ? "rgba(255,255,255,0.04)" : "transparent",
          borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
          marginLeft: active ? -2 : 0,
          color: "var(--color-text)",
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
                fontWeight: 600,
                color: active ? "#fff" : "var(--color-text)",
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
