import { useState } from "react";
import "./SendMessage.scss";
import { Ban, SendHorizonal } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import Button from "../../../../components/custom-components/custom-button";
import { useNotify } from "../../../../hooks/useNotify";
import SendPostNotification from "./SendPostNotification/SendPostNotification";
import ChannelsTab from "../tabs/ChannelsTab/ChannelsTab";
import {
  defaultChannel,
  TelegramChannel,
} from "../../../../types/telegram-channel";
import { Modal } from "antd";
import { API_URL } from "../../../../config";

const SendMessage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [infoText, setInfoText] = useState("");
  const [_, setLoadingDone] = useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<TelegramChannel>(defaultChannel);
  const [isModalOpen, setModalOpen] = useState(false);

  const { notify, contextHolder } = useNotify();

  const selectedVideos = useAppSelector(
    (state) => state.currentVideo.selectedVideos
  );
  const { ai_response, ai_loading } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);

  const handleSendPost = async () => {
    if (ai_response || selectedImages.length || selectedVideos.length) {
      // Тут идёт дальнейшая логика
    } else {
      notify({
        type: "error",
        title: "Нет контента.",
        body: "Введите текст или добавьте фото/видео.",
      });
      return;
    }

    setModalOpen(false);
    setLoading(true);
    setProgress(0);
    setInfoText("");
    setLoadingDone(false);
    setError(null);

    const formData = new URLSearchParams();
    formData.append("message", ai_response);
    formData.append(
      "channel",
      selectedChannel?.username
        ? `@${selectedChannel.username}`
        : `${selectedChannel.id}`
    );
    const photosArray = selectedImages?.map((i) => i.url) || [];
    if (photosArray.length)
      formData.append("photos", JSON.stringify(photosArray));

    const videoUrls = selectedVideos.map((v) => v.fullUrl).filter(Boolean);
    if (videoUrls.length) formData.append("videos", JSON.stringify(videoUrls));

    try {
      const response = await fetch(`${API_URL}sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        credentials: "include",
      });

      // Проверяем content-type ответа
      const contentType = response.headers.get("content-type");

      // Если ответ в формате JSON (скорее всего ошибка)
      if (contentType?.includes("application/json")) {
        const data = await response.json();

        if (!response.ok) {
          // Используем текст ошибки от сервера
          throw new Error(data.error || `Ошибка ${response.status}`);
        }
        // Если статус OK но JSON - обрабатываем как успех
        // (если такое возможно в вашем API)
      }

      // Если это не JSON, проверяем статус ответа
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }

      // Проверяем, что тело ответа существует для SSE
      if (!response.body) {
        throw new Error("Нет SSE потока");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n\n").forEach((msg) => {
          if (!msg.trim()) return;

          const line = msg.split("\n").find((l) => l.startsWith("data: "));
          if (!line) return;

          try {
            const data = JSON.parse(line.replace("data: ", ""));

            // Обновляем прогресс и info
            if (data.progress !== undefined) {
              setProgress(Math.round(data.progress));
              setInfoText(data.info || "");
            }

            // Завершение загрузки
            if (data.info === "Done" && data.details) {
              setLoading(false);
              setLoadingDone(true);

              notify({
                title: "Пост успешно отправлен!",
                body: (
                  <SendPostNotification
                    textSent={data.details.message}
                    videosSent={data.details.videosSent}
                    photosSent={data.details.photosSent}
                  />
                ),
                type: "success",
              });
            }

            // Ошибка в SSE потоке
            if (data.error) {
              notify({
                title: "Ошибка отправки поста!",
                body: data.error, // Используем текст ошибки от сервера
                type: "error",
              });
              setLoading(false);
              setLoadingDone(true);
            }
          } catch (parseError) {
            console.error("Ошибка парсинга SSE данных", parseError);
          }
        });
      }
    } catch (err) {
      console.error("Ошибка отправки поста", err);

      // Используем текст ошибки от сервера
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";

      setError(err instanceof Error ? err : new Error("Неизвестная ошибка"));
      setLoadingDone(true);
      setLoading(false);

      // Показываем уведомление с текстом ошибки от сервера
      notify({
        title: "Ошибка отправки поста!",
        body: errorMessage,
        type: "error",
      });
    }
  };

  const renderButtonText = () => {
    if (error) return `${error.message || "Повторите попытку"} `;
    if (loading && progress > 0) return `${progress}% ${infoText}`;
    if (ai_loading) return "Генерация поста";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div>
          <span>Отправить пост</span>
          <p style={{ fontSize: 12 }}>
            {selectedChannel.username
              ? `в @${selectedChannel.username}`
              : `в ID: ${selectedChannel.id}`}
          </p>
        </div>
        <SendHorizonal size={20} />
      </div>
    );
  };

  return (
    <div className="send-post-wrapper">
      {contextHolder}
      <div className="send-post-wrapper__subwrapper">
        <Modal
          open={isModalOpen}
          onCancel={() => setModalOpen(false)}
          width={"auto"}
          centered
          cancelButtonProps={{
            ghost: true,
          }}
          className="send-post-modal"
          cancelText="Отмена"
          okText={
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div>
                <span>Отправить пост</span>
                <p style={{ fontSize: 12 }}>
                  {selectedChannel.username
                    ? `в @${selectedChannel.username}`
                    : `в ID: ${selectedChannel.id}`}
                </p>
              </div>
              <SendHorizonal size={20} />
            </div>
          }
          okButtonProps={{
            style: {
              background: "var(--button-primary-bg)",
            },
          }}
          onOk={handleSendPost}
        >
          <ChannelsTab
            selectedChannel={selectedChannel}
            onClick={(channel: TelegramChannel) => setSelectedChannel(channel)}
            loadOnlyMyChannels={false}
          />
        </Modal>

        <Button
          type="primary"
          className="send-post-button"
          error={error?.message}
          onClick={() => setModalOpen(true)}
          disabled={loading || ai_loading}
          loading={loading || ai_loading}
          icon={error ? <Ban width={20} /> : null}
        >
          {renderButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default SendMessage;
