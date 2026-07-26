"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EN } from "./translations";

export type Locale = "ko" | "en";

const STORAGE_KEY = "nexus:locale";

/** Translate function: Korean source string is the key. */
export type TFn = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "en" || stored === "ko") setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "ko" ? "en" : "ko";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  // Korean is the source: `t` is identity for ko, dictionary lookup for en
  // (falling back to the Korean text when a string isn't translated yet).
  const t = useCallback<TFn>(
    (key, params) => interpolate(locale === "en" ? EN[key] ?? key : key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

/** Shorthand for components that only need the translate function. */
export function useT(): TFn {
  return useLocale().t;
}
