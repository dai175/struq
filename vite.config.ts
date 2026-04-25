import { readFileSync } from "node:fs";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version?: string };

const config = defineConfig(({ mode }) => {
  const isTest = mode === "test";

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version ?? "0.0.0"),
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
    ],
  };
});

export default config;
