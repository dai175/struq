import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts, useMatches } from "@tanstack/react-router";
import { ListMusic, Music, Settings } from "lucide-react";
import { getAuthUser } from "../auth/server-fns";
import type { SessionUser } from "../auth/session";
import { useI18n } from "../i18n";
import { I18nProvider } from "../i18n/provider";
import { DEFAULT_LOCALE } from "../i18n/types";
import { ToastProvider } from "../lib/toast";
import appCss from "../styles.css?url";

export interface RouterContext {
  user: SessionUser | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Struq — focuswave" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  beforeLoad: async () => {
    const user = await getAuthUser();
    return { user };
  },
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  const { user } = Route.useRouteContext();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";
  const isPerformView = currentPath.endsWith("/perform");

  return (
    <>
      <Outlet />
      {user && !isPerformView && <BottomNav />}
    </>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const tabs = [
    { to: "/setlists" as const, label: t.nav.setlists, icon: ListMusic },
    { to: "/songs" as const, label: t.nav.songs, icon: Music },
    { to: "/settings" as const, label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const user = Route.useRouteContext({ select: (ctx) => ctx.user });
  const locale = user?.locale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}
