// hooks/useUser.ts
import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "../api/user";

export const useUser = () => {
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutUser();
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
      queryClient.clear(); // Опционально: полная очистка всего кэша
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      throw error;
    }
  };

  return {
    logout: handleLogout,
  };
};
