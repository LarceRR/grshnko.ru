import { ReactNode } from "react";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useUser } from "../../../hooks/useUser";
import UserNavInfo from "./components/UserNavInfo";
import ThemeSwitcher from "../../ThemeSwitcher/ThemeSwitcher";

export interface NavUserMenuItem {
  key: string;
  label: string | ReactNode;
  icon?: ReactNode;
  link?: string;
  underline?: boolean;
  danger?: boolean;
  closeOnClick?: boolean;
  onClick?: () => void;
}

export const useNavUserMenu = (): NavUserMenuItem[] => {
  const { logout } = useUser();

  return [
    {
      key: "user-info",
      label: <UserNavInfo />,
      closeOnClick: false,
      underline: true,
    },
    {
      key: "profile",
      label: "Профиль",
      icon: <UserOutlined />,
      link: "/profile",
      closeOnClick: false,
    },
    {
      key: "settings",
      label: "Настройки",
      icon: <SettingOutlined />,
      closeOnClick: true,
    },
    {
      key: "themeSwitcher",
      label: <ThemeSwitcher />,
      closeOnClick: false,
    },
    {
      key: "logout",
      label: "Выйти",
      icon: <LogoutOutlined />,
      danger: true,
      closeOnClick: true,
      onClick: logout,
    },
  ];
};
