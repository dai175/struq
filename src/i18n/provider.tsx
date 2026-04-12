import { useState, useMemo, type ReactNode } from "react";
import { I18nContext, getTranslations } from "./index";
import type { Locale } from "./types";

interface I18nProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const value = useMemo(
    () => ({
      locale,
      t: getTranslations(locale),
      setLocale,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
