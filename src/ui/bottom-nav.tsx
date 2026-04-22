import { Link, useMatches } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { IconSetlists, IconSettings, IconSongs } from "./icons";

/**
 * BottomNav — mobile tab bar (< lg breakpoint). Dark surface with JBM meta
 * labels + top accent border on the active tab. Hides automatically on PC
 * where SideRail takes over, and on the Perform route (caller controls this).
 */
export function BottomNav() {
  const { t } = useI18n();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const tabs = [
    { to: "/setlists" as const, label: t.nav.setlists, Icon: IconSetlists },
    { to: "/songs" as const, label: t.nav.songs, Icon: IconSongs },
    { to: "/settings" as const, label: t.nav.settings, Icon: IconSettings },
  ];

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-50 flex border-t lg:hidden"
      style={{
        background: "var(--color-ink)",
        borderColor: "var(--color-line)",
      }}
    >
      {tabs.map(({ to, label, Icon }) => {
        const isActive = currentPath.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1.5 px-2 pt-3 pb-3"
            style={{
              color: isActive ? "#fff" : "var(--color-dim-2)",
              borderTop: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginTop: isActive ? -1 : 0,
            }}
          >
            <Icon size={18} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
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
  );
}
