import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { I18nProvider } from "../i18n/provider";
import { DEFAULT_LOCALE } from "../i18n/types";
import { getAuthUser } from "../auth/server-fns";
import type { SessionUser } from "../auth/session";
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
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  beforeLoad: async () => {
    const user = await getAuthUser();
    return { user };
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const user = Route.useRouteContext({ select: (ctx) => ctx.user });
  const locale = user?.locale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}
