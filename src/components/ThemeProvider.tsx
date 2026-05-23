"use client";

import * as React from "react";

export type ThemeName = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  enableSystem?: boolean;
  storageKey?: string;
  attribute?: "class";
}

interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeName) => void;
}

const STORAGE_EVENT = "genesis-theme-change";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);
const emptySubscribe = () => () => {};

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

function isThemeName(value: string | null): value is ThemeName {
  return value === "light" || value === "dark" || value === "system";
}

function getStoredTheme(storageKey: string, fallback: ThemeName): ThemeName {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(storageKey);
    return isThemeName(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return emptySubscribe();

  const mediaQuery = window.matchMedia(SYSTEM_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
  attribute = "class",
}: ThemeProviderProps) {
  const systemTheme = React.useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "light" as ResolvedTheme
  );
  const [theme, setThemeState] = React.useState<ThemeName>(() =>
    getStoredTheme(storageKey, defaultTheme)
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTheme = () => {
      setThemeState(getStoredTheme(storageKey, defaultTheme));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== storageKey) return;
      syncTheme();
    };

    const handleCustomEvent = () => {
      syncTheme();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_EVENT, handleCustomEvent);
    };
  }, [defaultTheme, storageKey]);

  const resolvedTheme: ResolvedTheme =
    theme === "system" && enableSystem ? systemTheme : theme === "dark" ? "dark" : "light";

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    if (attribute === "class") {
      root.classList.remove("dark");
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      }
    }

    root.style.colorScheme = resolvedTheme;
  }, [attribute, resolvedTheme]);

  const setTheme = React.useCallback(
    (nextTheme: ThemeName) => {
      setThemeState(nextTheme);

      if (typeof window === "undefined") return;

      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Ignore storage write failures and keep in-memory theme state.
      }

      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
