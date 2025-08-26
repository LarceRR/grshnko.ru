import React from "react";
import "./SendPostNotification.scss";

interface SendPostNotificationProps {
  textSent: string;
  videosSent: number;
  photosSent: number;
}

const SendPostNotification: React.FC<SendPostNotificationProps> = ({
  textSent,
  videosSent,
  photosSent,
}) => {
  // Очищаем текст от звездочек
  const cleanText = textSent.replace(/\*/g, "");

  return (
    <div className="send-post-notification">
      <p className="send-post-notification__text">
        Текст:{" "}
        <strong>
          {cleanText.length > 55 ? cleanText.slice(0, 55) + "..." : cleanText}
        </strong>
      </p>
      {videosSent !== undefined && (
        <p className="send-post-notification__media">
          Видео: <strong>{videosSent}</strong>
        </p>
      )}
      {photosSent !== undefined && (
        <p className="send-post-notification__media">
          Фото: <strong>{photosSent}</strong>
        </p>
      )}
    </div>
  );
};

export default SendPostNotification;
