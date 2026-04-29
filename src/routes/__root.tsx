import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useMatches } from "@tanstack/react-router";
import { getAuthUserWithCache } from "@/auth/cached-user";
import type { SessionUser } from "@/auth/session";
import { I18nProvider } from "@/i18n/provider";
import { DEFAULT_LOCALE } from "@/i18n/types";
import { THEME_PRE_PAINT_SCRIPT, ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";
import { ensureUserMatches } from "@/offline/db";
import { OfflineAnnouncer } from "@/offline/offline-announcer";
import { OfflineErrorBoundary } from "@/offline/offline-error-boundary";
import { SERVICE_WORKER_REGISTER_SCRIPT } from "@/offline/register-sw";
import appCss from "@/styles.css?url";
import { BottomNav } from "@/ui/bottom-nav";
import { SideRail } from "@/ui/side-rail";

export interface RouterContext {
  user: SessionUser | null;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-text-secondary">404 Not Found</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFound,
  errorComponent: OfflineErrorBoundary,
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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    // Inline pre-paint script: resolves theme before first paint to avoid FOUC.
    // Trusted constant — see src/lib/theme.ts.
    scripts: [{ children: THEME_PRE_PAINT_SCRIPT }, { children: SERVICE_WORKER_REGISTER_SCRIPT }],
  }),
  beforeLoad: async () => {
    const user = await getAuthUserWithCache();
    // Run before child loaders so a stale-user IDB never feeds them — without
    // this guard a logout-then-different-login flow can briefly serve the
    // previous account's cached songs/setlists.
    if (user) await ensureUserMatches(user.userId);
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
  const showNav = !!user && !isPerformView;

  return (
    <ThemeProvider>
      {showNav && <SideRail user={user} />}
      <div className={showNav ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[76px]" : ""}>
        <Outlet />
      </div>
      {showNav && <BottomNav />}
      <OfflineAnnouncer />
    </ThemeProvider>
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
