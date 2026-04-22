/**
 * Broadcast Console design tokens — TS constants mirroring the CSS custom
 * properties declared in src/styles.css. Use these when setting inline `style`
 * (e.g. dynamic per-section colors) or passing into style props. For static
 * Tailwind utilities, prefer `bg-[color:var(--color-ink)]` / `text-[color:var(--color-dim)]`.
 */
export const C = {
  ink: "var(--color-ink)",
  ink2: "var(--color-ink-2)",
  ink3: "var(--color-ink-3)",
  line: "var(--color-line)",
  line2: "var(--color-line-2)",
  text: "var(--color-text)",
  dim: "var(--color-dim)",
  dim2: "var(--color-dim-2)",
  dim3: "var(--color-dim-3)",
  accent: "var(--color-accent)",
  // raw values (for cases where `var()` can't be used, e.g. box-shadow color)
  live: "#ef4444",
} as const;

/** JetBrains Mono — numbers / meta labels / chord symbols. */
export const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
};

/** Inter — UI, headlines, body. */
export const sans: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
};
