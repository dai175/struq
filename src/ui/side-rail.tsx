import { Link, useMatches } from "@tanstack/react-router";
import type { SessionUser } from "@/auth/session";
import { useI18n } from "@/i18n";
import { IconSetlists, IconSettings, IconSongs, Logomark } from "./icons";

interface SideRailProps {
  user: SessionUser;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * SideRail — 76px-wide fixed PC navigation (≥ lg breakpoint).
 * Logomark on top, 3 icon-over-label tabs in the middle (SETLISTS / SONGS /
 * SETTINGS), 32×32 accent avatar on the bottom showing the user's initials.
 * Active tab has a 2px accent left border and full-white label.
 */
export function SideRail({ user }: SideRailProps) {
  const { t } = useI18n();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const tabs = [
    { to: "/setlists" as const, label: t.nav.setlists, Icon: IconSetlists },
    { to: "/songs" as const, label: t.nav.songs, Icon: IconSongs },
    { to: "/settings" as const, label: t.nav.settings, Icon: IconSettings },
  ];

  return (
    <aside
      className="fixed top-0 bottom-0 left-0 z-50 hidden w-[76px] flex-col items-center justify-between border-r lg:flex"
      style={{
        background: "var(--color-ink)",
        borderColor: "var(--color-line)",
        paddingTop: 22,
        paddingBottom: 22,
      }}
    >
      <div className="flex items-center justify-center" style={{ height: 32 }}>
        <Logomark size={32} />
      </div>

      <nav className="flex flex-1 flex-col items-stretch justify-center gap-2 self-stretch">
        {tabs.map(({ to, label, Icon }) => {
          const isActive = currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 py-3"
              style={{
                color: isActive ? "#fff" : "var(--color-dim-2)",
                borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
            >
              <Icon size={18} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  letterSpacing: "0.22em",
                  fontWeight: isActive ? 600 : 500,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        title={user.name}
        className="flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          background: "var(--color-accent)",
          color: "#0b0b0b",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          fontWeight: 700,
        }}
      >
        {initials(user.name)}
      </div>
    </aside>
  );
}
