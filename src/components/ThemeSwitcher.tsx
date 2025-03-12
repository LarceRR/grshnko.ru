import { Switch } from "antd";
import useTheme from "../hooks/useTheme";

const ThemeSwitcher = () => {
  const [, toggleTheme] = useTheme();

  return (
    <Switch
      defaultChecked
      checkedChildren={"Dark"}
      unCheckedChildren={"Light"}
      onChange={toggleTheme}
    />
  );
};

export default ThemeSwitcher;
