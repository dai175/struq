import { readFileSync } from "node:fs";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version?: string };
const semver = pkg.version ?? "0.0.0";

// GitHub Actions exposes a monotonic per-repo build number and the run's
// start timestamp; both surface on the ABOUT screen. Local builds get a
// "dev" build label and today's date in JST so the UI never shows blanks.
const buildNumber = process.env.GITHUB_RUN_NUMBER ?? "dev";
const releasedDate = (() => {
  const raw = process.env.GITHUB_RUN_STARTED_AT;
  const d = raw ? new Date(raw) : new Date();
  return d
    .toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");
})();

// vite-plugin-pwa 1.x stores its resolved config in a shared variable across
// configResolved calls; under Vite 7's Environment API the SSR config wins and
// closeBundle then skips SW generation. Wrap configResolved to ignore SSR
// configs and pin build hooks to the client env to keep generation alive.
function pwaClientPlugins() {
  const plugins = VitePWA({
    registerType: "autoUpdate",
    injectRegister: false,
    manifestFilename: "manifest.json",
    includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png", "robots.txt"],
    manifest: {
      short_name: "Struq",
      name: "Struq — focuswave",
      icons: [
        { src: "favicon.ico", sizes: "64x64 48x48 32x32 16x16", type: "image/x-icon" },
        { src: "logo192.png", type: "image/png", sizes: "192x192" },
        { src: "logo512.png", type: "image/png", sizes: "512x512" },
      ],
      start_url: "/",
      display: "standalone",
      theme_color: "#f8f7f5",
      background_color: "#f8f7f5",
    },
    workbox: {
      globPatterns: ["**/*.{js,css,svg,png,ico,webmanifest}"],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      // Claim the current page on first install so the navigation rule below
      // starts capturing on the very first online visit (otherwise the next
      // offline reload sees an empty cache).
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          // SSR'd HTML isn't precached (TanStack Start renders per request);
          // NetworkFirst keeps online users on fresh HTML and falls back to
          // the last successful response when the network is unreachable.
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkFirst",
          options: {
            cacheName: "struq-pages",
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 50 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  });
  const mainPlugin = plugins.find((p) => p && typeof p === "object" && "name" in p && p.name === "vite-plugin-pwa") as
    | { configResolved?: (config: { build: { ssr?: boolean | string } }) => unknown }
    | undefined;
  if (mainPlugin?.configResolved) {
    const original = mainPlugin.configResolved.bind(mainPlugin);
    mainPlugin.configResolved = async (config) => {
      if (config.build.ssr) return;
      return original(config);
    };
  }
  for (const plugin of plugins) {
    if (plugin && typeof plugin === "object" && "name" in plugin) {
      plugin.applyToEnvironment = (env) => env.name === "client";
    }
  }
  return plugins;
}

const config = defineConfig(({ mode }) => {
  const isTest = mode === "test";

  return {
    define: {
      __APP_SEMVER__: JSON.stringify(semver),
      __APP_VERSION__: JSON.stringify(`${semver} · build ${buildNumber}`),
      __APP_RELEASED__: JSON.stringify(releasedDate),
    },
    test: {
      exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    },
    plugins: [
      devtools(),
      ...(isTest ? [] : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      ...(isTest ? [] : pwaClientPlugins()),
    ],
  };
});

export default config;
