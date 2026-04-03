"use client";

import * as React from "react";

type ThemeMode = "dark" | "light";

interface ThemeModeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeModeContext = React.createContext<ThemeModeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "sse-theme-mode";

interface ThemeModeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeModeProvider({
  children,
  defaultMode = "dark",
}: ThemeModeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultMode);

  React.useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = React.useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
}

export { ThemeModeContext };
export type { ThemeMode };
