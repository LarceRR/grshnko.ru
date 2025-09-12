// api/user.ts
import axios from "axios";
import { API_URL } from "../config";
import { Role } from "../types/user";

export const getRoles = async (): Promise<Role[] | null> => {
  try {
    const res = await axios.get<Role[]>(`${API_URL}api/permissions/roles`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      return null;
    }
    throw err;
  }
};