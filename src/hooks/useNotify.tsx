import { ReactNode } from "react";
import { notification } from "antd";

type NotificationType = "success" | "info" | "warning" | "error";

interface NotifyProps {
  title: string | ReactNode;
  body: string | ReactNode;
  type: NotificationType;
  duration?: number;
}

export const useNotify = () => {
  const [api, contextHolder] = notification.useNotification();

  const notify = ({ title, body, type, duration }: NotifyProps) => {
    api[type]({
      message: title,
      description: body,
      duration: duration ?? 10, // Продолжительность уведомления в секундах
    });
  };

  return { notify, contextHolder };
};
