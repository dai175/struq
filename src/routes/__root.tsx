import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { I18nProvider } from "../i18n/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Struq — focuswave" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider initialLocale="ja">{children}</I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}
