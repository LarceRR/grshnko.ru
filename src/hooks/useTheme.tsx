import { useLayoutEffect, useState } from "react";
import { setFavicon } from "../utils/favicon";

export type ThemeType = "light" | "dark";

const useTheme = (): [ThemeType, () => void] => {
  const getPreferredTheme = (): ThemeType => {
    const storedTheme = localStorage.getItem("app-theme") as ThemeType | null;

    if (storedTheme) {
      return storedTheme;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState<ThemeType>(getPreferredTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);

    if (theme === "dark") {
      setFavicon("/favicon/dark.png");
    } else {
      setFavicon("/favicon/light.png");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return [theme, toggleTheme];
};

export default useTheme;
