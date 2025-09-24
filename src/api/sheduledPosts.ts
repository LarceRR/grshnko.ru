// api/scheduledPosts.ts
import axios from "axios";
import { API_URL } from "../config";
import { ScheduledPost } from "../types/sheduledPost";

// --- существующие функции ---
export const createScheduledPost = async (data: {
  userId?: string;
  channelId: string;
  text?: string;
  photos?: string[];
  videos?: string[];
  timestamp?: string;
}): Promise<ScheduledPost> => {
  const res = await axios.post(`${API_URL}api/schedule`, {
    ...data
  }, {
    withCredentials: true,
  });

  return res.data;
};

export const getScheduledPosts = async (userId?: string): Promise<ScheduledPost[]> => {
  const res = await axios.get(`${API_URL}api/schedule`, {
    params: userId ? { userId } : {},
    withCredentials: true,
  });
  return res.data;
};

export const deleteScheduledPost = async (id: string): Promise<ScheduledPost> => {
  const res = await axios.delete(`${API_URL}api/schedule/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const reloadScheduledPosts = async (): Promise<{
  message: string;
  restoredCount: number;
  restoredIds: string[];
}> => {
  const res = await axios.get(`${API_URL}api/schedule/reload`, {
    withCredentials: true,
  });
  return res.data;
};

export const searchScheduledPosts = async (filters: {
  userId?: string;
  chatId?: string;
  text?: string;
  status?: string;
  timestampFrom?: string;
  timestampTo?: string;
}): Promise<ScheduledPost[]> => {
  const res = await axios.get(`${API_URL}api/schedule/search`, {
    params: filters,
    withCredentials: true,
  });
  return res.data;
};

// --- новая функция для редактирования поста ---
export const updateScheduledPost = async (id: string, data: {
  channelId?: string;
  text?: string;
  photos?: string[];
  videos?: string[];
  timestamp?: string; // ISO string
}): Promise<ScheduledPost> => {
  const payload = {
    ...data,
    timestamp: data.timestamp,
  };

  const res = await axios.patch(`${API_URL}api/schedule/${id}`, payload, {
    withCredentials: true,
  });

  return res.data;
};
