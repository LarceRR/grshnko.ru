// api/telegram.ts
import axios from "axios";
import { API_URL } from "../config";
import { User } from "../types/user";

export interface ISession {
  id: string;
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: string; // ISO date string
  refreshToken: string;
  refreshTokenExpiresAt: string; // ISO date string
  ipAddress: string;
  userAgent: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  user: User;
  logins: {
    id: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
  }[];
}

export const getSessionByUserId = async (id: string): Promise<ISession[]> => {
    const res = await axios.get<ISession[]>(`${API_URL}api/sessions/get/${id}`, {
        withCredentials: true,
    });
    return res.data;
};

export const deleteSession = async (id: string): Promise<ISession> => {
    const res = await axios.delete<ISession>(`${API_URL}api/sessions/${id}`, {
        withCredentials: true,
    });
    return res.data;
};