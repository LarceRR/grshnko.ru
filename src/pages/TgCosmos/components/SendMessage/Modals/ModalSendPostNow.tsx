import { Modal } from "antd";
import React, { useState } from "react";
import { TelegramChannel } from "../../../../../types/telegram-channel";
import { SendHorizonal } from "lucide-react";
import ChannelsTab from "../../tabs/ChannelsTab/ChannelsTab";
import { IImage } from "../../../../../features/imagesSlice";
import { IChannelInfo } from "../../../../../types/tiktok";
import { useNotify } from "../../../../../hooks/useNotify";
import { API_URL } from "../../../../../config";
import SendPostNotification from "../SendPostNotification/SendPostNotification";
import { Entity } from "../../../../../components/MarkdownEditor/MarkdownEditor";

interface IModalSendPostNowProps {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  ai_response: string;
  selectedImages: IImage[];
  setProgress: (value: number) => void;
  setInfoText: (value: string) => void;
  setLoading: (value: boolean) => void;
  post_entities: Entity[];
  setError: (value: Error | null) => void;
  loading: boolean;
  error: Error | null;
  selectedVideos: IChannelInfo[];
  selectedChannel: TelegramChannel;
  setSelectedChannel: (channel: TelegramChannel) => void;
  onPostSent?: (text: string) => void;
}

const ModalSendPostNow: React.FC<IModalSendPostNowProps> = ({
  isModalOpen,
  post_entities,
  setModalOpen,
  ai_response,
  setLoading,
  setError,
  setInfoText,
  setProgress,
  selectedImages,
  selectedVideos,
  selectedChannel,
  setSelectedChannel,
  onPostSent,
}) => {
  const { notify, contextHolder } = useNotify();
  const [_, setLoadingDone] = useState(false);
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
      selectedChannel?.entity?.username
        ? `@${selectedChannel?.entity?.username}`
        : `${selectedChannel.id}`
    );

    if (post_entities.length)
      formData.append("entities", JSON.stringify(post_entities));

    const photosArray = selectedImages?.map((i) => i.url) || [];
    if (photosArray.length)
      formData.append("photos", JSON.stringify(photosArray));

    const videoUrls = selectedVideos.map((v) => v.fullUrl).filter(Boolean);
    if (videoUrls.length) formData.append("videos", JSON.stringify(videoUrls));

    // const updatedEntities: Entity[] = [...post_entities];

    // videoUrls.forEach((videoUrl) => {
    //   if (videoUrl) {
    //     updatedEntities.push({
    //       type: "text_url",
    //       offset: 0, // Можно выбрать смещение 0, если текст не отображается, или подставить длину имени видео
    //       length: videoUrl.length, // Можно использовать длину строки URL
    //       url: videoUrl,
    //     });
    //   }
    // });

    // // Теперь используем updatedEntities для отправки
    // // if (updatedEntities.length) {
    // //   formData.append("entities", JSON.stringify(updatedEntities));
    // // }

    let hasSavedHashtags = false;

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

              if (!hasSavedHashtags) {
                const messageText =
                  typeof data.details.message === "string"
                    ? data.details.message
                    : ai_response;
                if (messageText) {
                  onPostSent?.(messageText);
                }
                hasSavedHashtags = true;
              }
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

  return (
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
              {selectedChannel?.entity?.username
                ? `в @${selectedChannel?.entity?.username}`
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
      {contextHolder}
      <ChannelsTab
        selectedChannel={selectedChannel}
        onClick={(channel: TelegramChannel) => setSelectedChannel(channel)}
        loadOnlyMyChannels={false}
      />
    </Modal>
  );
};

export default ModalSendPostNow;
