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
 * Layout: logo section + border → flex-1 nav with tabs at flex-start → avatar
 * section + border. Active tab has a 2px accent left border and `color: #fff`.
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
      className="fixed top-0 bottom-0 left-0 z-50 hidden w-[76px] flex-col border-r lg:flex"
      style={{
        background: "var(--color-ink)",
        borderColor: "var(--color-line)",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          padding: "18px 0",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <Logomark size={26} />
      </div>

      <nav className="flex flex-col" style={{ flex: 1, paddingTop: 6 }}>
        {tabs.map(({ to, label, Icon }) => {
          const isActive = currentPath === to || currentPath.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center"
              aria-current={isActive ? "page" : undefined}
              style={{
                padding: "18px 0 16px",
                gap: 6,
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
                  fontWeight: isActive ? 600 : 400,
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
        style={{
          padding: "14px 0",
          borderTop: "1px solid var(--color-line)",
        }}
      >
        <div
          title={user.name}
          className="mx-auto flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: "var(--color-accent)",
            color: "#000",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {initials(user.name)}
        </div>
      </div>
    </aside>
  );
}
