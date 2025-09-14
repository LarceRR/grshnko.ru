export interface ScheduledPost {
  id: string;
  userId: string;
  chatId: string;
  text?: string;
  photos: string[];
  videos: string[];
  timestamp: string; // ISO string
  status: "PENDING" | "SENT" | "CANCELLED" | "FAILED";
  createdAt: string;
  updatedAt?: string;
}

export const STATUS_MAP: Record<
  ScheduledPost["status"],
  { label: string; color: string }
> = {
  PENDING: { label: "В ожидании", color: "#F9C74F" },
  SENT: { label: "Отправлено", color: "#4CAF50" },
  CANCELLED: { label: "Отменено", color: "#DA3633" },
  FAILED: { label: "Ошибка", color: "#FF7B72" },
};