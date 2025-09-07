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