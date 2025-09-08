import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser, logoutUser, updateUser as updateUserApi } from "../api/user";
import { User } from "../types/user";

export const useUser = () => {
  const queryClient = useQueryClient();

  // ✅ Получаем юзера через useQuery
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: getUser,
    retry: false,
  });

  // ✅ Мутация для обновления юзера
  const { mutateAsync: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<User>) => {
      return updateUserApi(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // ✅ Логаут
  const logout = async () => {
    try {
      await logoutUser();
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
      queryClient.clear(); // полная очистка всего кэша
    } catch (err) {
      console.error("Ошибка при выходе:", err);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    updateUser, // 👈 вызывать так: await updateUser({ firstName: "Иван" })
    isUpdating, // 👈 можно показать лоадер
    logout,
  };
};
