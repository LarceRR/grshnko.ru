import { Switch } from "antd";
import useTheme from "../hooks/useTheme";

const ThemeSwitcher = () => {
  const [theme, toggleTheme] = useTheme();

  return (
    <Switch
      defaultChecked
      checkedChildren={theme}
      unCheckedChildren={theme}
      onChange={toggleTheme}
    />
  );
};

export default ThemeSwitcher;
