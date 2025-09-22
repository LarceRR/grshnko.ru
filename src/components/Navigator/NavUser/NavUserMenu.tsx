import { ReactNode } from "react";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useUser } from "../../../hooks/useUser";
import UserNavInfo from "./components/UserNavInfo";
import ThemeSwitcher from "../../ThemeSwitcher/ThemeSwitcher";
import { MonitorCog } from "lucide-react";

export interface NavUserMenuItem {
  key: string;
  label: string | ReactNode;
  icon?: ReactNode;
  link?: string;
  underline?: boolean;
  danger?: boolean;
  closeOnClick?: boolean;
  onClick?: () => void;
  enabled?: boolean;
}

export const useNavUserMenu = (): NavUserMenuItem[] => {
  const { logout, user } = useUser();

  return [
    {
      key: "user-info",
      label: <UserNavInfo />,
      closeOnClick: false,
      underline: true,
      enabled: true,
    },
    {
      key: "profile",
      label: "Профиль",
      icon: <UserOutlined />,
      link: "/profile",
      closeOnClick: false,
      enabled: true,
    },
    {
      key: "settings",
      label: "Настройки",
      icon: <SettingOutlined />,
      link: "/settings",
      closeOnClick: true,
      enabled: true,
    },
    {
      key: "system",
      label: "Система",
      icon: <MonitorCog size={16} />,
      link: "/system",
      closeOnClick: true,
      enabled: user?.role?.key === "ADMIN",
    },
    {
      key: "themeSwitcher",
      label: <ThemeSwitcher />,
      closeOnClick: false,
      enabled: true,
    },
    {
      key: "logout",
      label: "Выйти",
      icon: <LogoutOutlined />,
      danger: true,
      closeOnClick: true,
      enabled: true,
      onClick: logout,
    },
  ];
};
