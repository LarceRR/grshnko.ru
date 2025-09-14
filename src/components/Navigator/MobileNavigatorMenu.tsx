import { Bell, Home } from "lucide-react";
import CustomNavLink from "../custom-components/custom-link";
import CircleImage from "../CircleImage/CircleImage";
import { API_URL } from "../../config";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "../../types/user";

export function useMenuItems() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<User>(["user"]);

  const items = [
    {
      label: (
        <CustomNavLink to="/">
          <Home size={22} />
          <span>Главная</span>
        </CustomNavLink>
      ),
      key: "0",
    },
    {
      label: (
        <CustomNavLink to="/profile">
          <CircleImage
            src={`${API_URL}cdn/avatar/${user?.avatarUrl}`}
            imageStyle={{ width: 24, height: 24, borderRadius: "50%" }}
          />
          <span>{user?.username}</span>
        </CustomNavLink>
      ),
      key: "1",
    },
    {
      label: (
        <CustomNavLink to="/notifications">
          <Bell size={22} />
          <span>Уведомления</span>
        </CustomNavLink>
      ),
      key: "2",
    },
  ];

  return items;
}
