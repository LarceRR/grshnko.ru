import type { Theme } from "../types/theme";

const STORAGE_KEY = "app-selected-theme";

export function getStoredSelectedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Theme;
  } catch {
    return null;
  }
}

export function setStoredSelectedTheme(theme: Theme | null): void {
  if (theme === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }
}
