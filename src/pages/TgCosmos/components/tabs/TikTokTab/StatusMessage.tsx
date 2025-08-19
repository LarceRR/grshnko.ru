import React from "react";

interface StatusMessageProps {
  isLoading: boolean;
  isError: boolean;
  hasQueryUrl: boolean;
  channelInfo: any;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  isLoading,
  isError,
  hasQueryUrl,
  channelInfo,
}) => {
  const getMessage = () => {
    if (isError) {
      return "Ошибка загрузки видео. Убедитесь, что отправили ссылку в правильном формате!";
    }

    if (isLoading) {
      return "Идет загрузка видео... Может занять некоторое время";
    }

    if (hasQueryUrl && channelInfo) {
      return null; // ChannelInfo component will handle this
    }

    return "Здесь будет информация о видео‑ролике";
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <span
      className="tiktok__inner-wrapper__description"
      style={{ color: isError ? "red" : "inherit" }}
    >
      {message}
    </span>
  );
};
