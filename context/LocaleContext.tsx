"use client";

import React, { createContext, useContext, useState } from "react";
import { Locale, MemberMode, resolveTranslations } from "@/lib/i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translation = any;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: resolveTranslations("en", "venue"),
});

export function LocaleProvider({ children, memberMode = "venue" }: { children: React.ReactNode; memberMode?: MemberMode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = resolveTranslations(locale, memberMode);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
