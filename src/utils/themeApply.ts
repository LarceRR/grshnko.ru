import type { Theme } from "../types/theme";

const THEME_CSS_KEYS = [
  "nav-background",
  "nav-text-color",
  "nav-text-active",
  "color-white",
  "color-light-gray",
  "color-medium-gray",
  "color-dark-gray",
  "color-black",
  "background-color",
  "card-background",
  "text-color",
  "text-secondary",
  "link-color",
  "input-background",
  "input-text",
  "input-border",
  "input-placeholder",
  "input-focus",
  "button-primary-bg",
  "button-primary-text",
  "button-primary-hover",
  "button-secondary-bg",
  "button-secondary-text",
  "button-secondary-border",
  "button-secondary-hover",
  "button-danger-bg",
  "button-danger-text",
  "button-danger-hover",
  "notification-success-bg",
  "notification-success-text",
  "notification-warning-bg",
  "notification-warning-text",
  "notification-error-bg",
  "notification-error-text",
  "border-color",
  "divider-color",
  "color-blue",
  "color-green",
  "color-red",
  "color-orange",
  "color-purple",
  "color-yellow",
] as const;

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
  const dataTheme = theme.type === "dark" ? "dark" : "light";
  root.setAttribute("data-theme", dataTheme);
}

export function clearCustomTheme(): void {
  const root = document.documentElement;
  for (const key of THEME_CSS_KEYS) {
    root.style.removeProperty(`--${key}`);
  }
  const storedAppTheme = localStorage.getItem("app-theme") as "light" | "dark" | null;
  root.setAttribute("data-theme", storedAppTheme ?? "light");
}
