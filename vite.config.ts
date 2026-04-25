import { readFileSync } from "node:fs";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
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

const config = defineConfig(({ mode }) => {
  const isTest = mode === "test";
  const enableDevtools = mode === "development" && !process.env.CI && process.env.VITE_ENABLE_DEVTOOLS === "1";

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
      ...(enableDevtools ? [devtools()] : []),
      ...(isTest ? [] : [cloudflare({ viteEnvironment: { name: "ssr" }, inspectorPort: false })]),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  };
});

export default config;
