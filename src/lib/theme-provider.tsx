"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/** Resolved appearance actually applied to the document. */
export type Theme = "light" | "dark";
/** User preference: an explicit theme, or "system" to follow the OS. */
export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "nexus:theme";

interface ThemeContextValue {
  /** The stored preference (system/light/dark). */
  mode: ThemeMode;
  /** The resolved theme currently applied (light/dark). */
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  /** Quick flip between light/dark (sets an explicit preference). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): Theme {
  return mode === "system" ? systemTheme() : mode;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Inline script injected in <head> so the correct theme class is set before hydration (no flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||((s===null||s==='system')&&d))document.documentElement.classList.add('dark');}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeMode =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(initial);
    setTheme(resolveTheme(initial));
  }, []);

  // While following the system, react to OS light/dark changes live.
  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = systemTheme();
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const resolved = resolveTheme(next);
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setModeState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
