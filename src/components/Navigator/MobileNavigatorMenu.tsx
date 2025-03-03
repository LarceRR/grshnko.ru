import { MenuProps } from "antd";
import CustomNavLink from "../custom-components/custom-link";
import ThemeSwitcher from "../ThemeSwitcher";

export const items: MenuProps["items"] = [
  {
    label: <CustomNavLink to="/">Telegram Autopost CRM</CustomNavLink>,
    key: "0",
  },
  {
    label: <CustomNavLink to="/other">Other future shit</CustomNavLink>,
    key: "1",
  },
  {
    type: "divider",
  },
  {
    label: <ThemeSwitcher />,
    key: "3",
  },
];
