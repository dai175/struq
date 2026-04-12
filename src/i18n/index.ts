import { createContext, useContext } from "react";
import type { Locale, SectionType, Translations } from "./types";
import { ja } from "./locales/ja";
import { en } from "./locales/en";

export type { Locale, SectionType, Translations };

const dictionaries: Record<Locale, Translations> = { ja, en };

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale];
}

/** Fixed section types use locale-derived label; custom uses the DB label */
export function getSectionLabel(
  type: SectionType,
  locale: Locale,
  customLabel?: string | null,
): string {
  if (type === "custom" && customLabel) return customLabel;
  return getTranslations(locale).section[type];
}

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
