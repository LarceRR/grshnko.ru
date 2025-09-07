import useTheme from "../../hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import "./ThemeSwitcher.scss";

const ThemeSwitcher = () => {
  const [theme, toggleTheme] = useTheme();
  return (
    <div onClick={toggleTheme} className="theme-switcher">
      {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
      <span>Сменить тему на {theme === "light" ? "темную" : "светлую"}</span>
    </div>
  );
};

export default ThemeSwitcher;
