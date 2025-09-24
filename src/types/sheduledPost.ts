import { User } from "./user";

export type PostUser = Pick<User, "id" | "username" | "avatarUrl">;

export interface ScheduledPost {
  id: string;
  userId: string;
  chatId: string;
  text?: string;
  photos: string[];
  videos: string[];
  timestamp: string; // ISO string
  status: "PENDING" | "SENT" | "CANCELLED" | "FAILED";
  errorDetails?: string; // Details about failure if status is FAILED
  createdAt: string;
  updatedAt?: string;
  user?: PostUser;
  ScheduledVideo?: IScheduledVideo[];
}

export interface IScheduledVideo {
  createdAt: string;
  id: string;
  scheduledPostId: string;
  url: string;
}

export const STATUS_MAP: Record<
  ScheduledPost["status"],
  { label: string; color: string }
> = {
  PENDING: { label: "В ожидании", color: "#F9C74F" },
  SENT: { label: "Отправлено", color: "#4CAF50" },
  CANCELLED: { label: "Отменено", color: "#FF7B72" },
  FAILED: { label: "Ошибка", color: "#DA3633" },
};