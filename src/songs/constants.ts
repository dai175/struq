import type { SectionType } from "@/i18n/types";

export const SECTION_COLORS: Record<SectionType, string> = {
  intro: "var(--color-section-intro)",
  a: "var(--color-section-a)",
  b: "var(--color-section-b)",
  chorus: "var(--color-section-chorus)",
  bridge: "var(--color-section-bridge)",
  solo: "var(--color-section-solo)",
  outro: "var(--color-section-outro)",
  interlude: "var(--color-section-interlude)",
  custom: "var(--color-section-custom)",
};

export const DEFAULT_BARS: Record<SectionType, number> = {
  intro: 4,
  a: 8,
  b: 8,
  chorus: 8,
  bridge: 8,
  solo: 8,
  outro: 4,
  interlude: 4,
  custom: 8,
};
