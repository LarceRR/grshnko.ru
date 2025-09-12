// hooks/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

type LoginPayload = {
  login: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginPayload) => {
      const res = await axios.post(`${API_URL}api/auth/login`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // После успешного входа обновляем данные пользователя в кэше
      queryClient.setQueryData(["user"], data.user);
      // И сразу делаем навигацию
      navigate("/", { replace: true });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const res = await axios.post(`${API_URL}api/auth/register`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      navigate("/", { replace: true });
    },
  });

  return {
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,
  };
}
