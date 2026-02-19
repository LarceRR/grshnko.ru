import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Theme } from "../types/theme";
import {
  getMySelectedTheme,
  selectTheme as selectThemeApi,
} from "../api/themes";
import { applyTheme, clearCustomTheme } from "../utils/themeApply";
import {
  getStoredSelectedTheme,
  setStoredSelectedTheme,
} from "../utils/themeStorage";

type ThemeId = string;

interface SelectedThemeContextValue {
  selectedTheme: Theme | null;
  selectedThemeId: ThemeId | null;
  isInitialized: boolean;
  applyAndSelectTheme: (theme: Theme) => Promise<void>;
  clearAndDeselectTheme: () => Promise<void>;
  setSelectedThemeLocal: (theme: Theme | null) => void;
}

const SelectedThemeContext = createContext<SelectedThemeContextValue | null>(
  null,
);

const themeId = (t: Theme): string => t.id ?? t._id;

export function SelectedThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setSelectedThemeLocal = useCallback((theme: Theme | null) => {
    setSelectedTheme(theme);
    if (theme) {
      setStoredSelectedTheme(theme);
      applyTheme(theme);
    } else {
      setStoredSelectedTheme(null);
      clearCustomTheme();
    }
  }, []);

  const applyAndSelectTheme = useCallback(async (theme: Theme) => {
    const id = themeId(theme);
    await selectThemeApi(id);
    setStoredSelectedTheme(theme);
    applyTheme(theme);
    setSelectedTheme(theme);
  }, []);

  const clearAndDeselectTheme = useCallback(async () => {
    await selectThemeApi(null);
    setStoredSelectedTheme(null);
    clearCustomTheme();
    setSelectedTheme(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = getStoredSelectedTheme();
      if (stored) {
        applyTheme(stored);
        if (!cancelled) setSelectedTheme(stored);
        if (!cancelled) setIsInitialized(true);
        return;
      }
      try {
        const theme = await getMySelectedTheme();
        if (cancelled) return;
        if (theme) {
          applyTheme(theme);
          setSelectedTheme(theme);
          setStoredSelectedTheme(theme);
        }
      } catch {
        // not authenticated or error
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: SelectedThemeContextValue = {
    selectedTheme,
    selectedThemeId: selectedTheme ? themeId(selectedTheme) : null,
    isInitialized,
    applyAndSelectTheme,
    clearAndDeselectTheme,
    setSelectedThemeLocal,
  };

  return (
    <SelectedThemeContext.Provider value={value}>
      {children}
    </SelectedThemeContext.Provider>
  );
}

export function useSelectedTheme(): SelectedThemeContextValue {
  const ctx = useContext(SelectedThemeContext);
  if (!ctx) {
    throw new Error(
      "useSelectedTheme must be used within SelectedThemeProvider",
    );
  }
  return ctx;
}

export function useSelectedThemeOptional(): SelectedThemeContextValue | null {
  return useContext(SelectedThemeContext);
}
