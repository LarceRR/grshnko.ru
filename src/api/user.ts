// api/user.ts
import axios from "axios";
import { API_URL } from "../config";
import { User } from "../types/user";

export const getUser = async (): Promise<User | null> => {
  try {
    const res = await axios.get(`${API_URL}api/sessions/me`, {
      withCredentials: true,
    });
    return res.data.user;
  } catch (err: any) {
    if (err.response?.status === 401) {
      return null;
    }
    throw err;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await axios.delete(`${API_URL}api/sessions/current`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Ошибка при выходе:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<User>) => {
  const formData = new FormData();
  formData.append("userId", userId);

  // перебираем поля, которые реально пришли
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });

  const res = await fetch(`${API_URL}api/user/update`, {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Ошибка обновления пользователя");
  }

  return res.json();
};