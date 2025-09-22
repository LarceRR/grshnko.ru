import { Input, Modal } from "antd";
import React, { useState } from "react";
import { TelegramChannel } from "../../../../../types/telegram-channel";
import { CalendarClock, SendHorizonal } from "lucide-react";
import ChannelsTab from "../../tabs/ChannelsTab/ChannelsTab";
import { useNotify } from "../../../../../hooks/useNotify";
import { IChannelInfo } from "../../../../../types/tiktok";
import { IImage } from "../../../../../features/imagesSlice";
import { createScheduledPost } from "../../../../../api/sheduledPosts";
import { toDatetimeLocalValue } from "../../../../../utils/date";

interface IModalSendPostNowProps {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  ai_response: string;
  setLoading: (value: boolean) => void;
  setError: (value: Error | null) => void;
  loading: boolean;
  error: Error | null;
  selectedImages: IImage[];
  selectedVideos: IChannelInfo[];
  selectedChannel: TelegramChannel;
  setSelectedChannel: (channel: TelegramChannel) => void;
}

const ModalSendPostNow: React.FC<IModalSendPostNowProps> = ({
  isModalOpen,
  setModalOpen,
  ai_response,
  selectedImages,
  setLoading,
  setError,
  selectedVideos,
  selectedChannel,
  setSelectedChannel,
}) => {
  const timeOffset = 1 * 60 * 60 * 1000; // Час вперёд
  const { notify, contextHolder } = useNotify();
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date>(
    new Date(Date.now() + timeOffset)
  );
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const handleSendScheduledPost = async () => {
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
    setError(null);
    const photosArray = selectedImages?.map((i) => i.url) || [];
    const videoUrls: string[] =
      selectedVideos.map((v) => v.fullUrl).filter((v): v is string => !!v) ||
      [];

    try {
      // Переводим в UTC с учётом смещения клиента
      const timestamp = new Date(Date.now() + timeOffset).toISOString();
      createScheduledPost({
        channelId: selectedChannel?.entity?.username
          ? `@${selectedChannel?.entity?.username}`
          : `${selectedChannel.id}`,
        text: ai_response,
        photos: photosArray,
        videos: videoUrls,
        timestamp: timestamp,
      });
      notify({
        title: "Успех",
        body: "Пост отправлен в очередь на отправку",
        type: "success",
      });
      setLoading(false);
    } catch (err) {
      console.error("Ошибка отправки поста", err);

      // Используем текст ошибки от сервера
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";

      setError(err instanceof Error ? err : new Error("Неизвестная ошибка"));
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
      width={"auto"}
      centered
      onCancel={() => setModalOpen(false)}
      cancelButtonProps={{
        ghost: true,
      }}
      className="send-post-modal"
      footer={
        <div className="send-post-modal__footer">
          <button
            onClick={() => setModalOpen(false)}
            style={{ background: "unset", color: "var(--text-color)" }}
          >
            Отмена
          </button>
          <button onClick={() => setIsDatePickerModalOpen(true)}>
            {selectedScheduleDate ? (
              <span>{selectedScheduleDate.toLocaleString()}</span>
            ) : (
              "Выбрать дату"
            )}{" "}
            <CalendarClock size={20} />
          </button>
          <button
            style={{
              background: "var(--button-primary-bg)",
            }}
            onClick={handleSendScheduledPost}
          >
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
          </button>
        </div>
      }
    >
      {contextHolder}
      <ChannelsTab
        selectedChannel={selectedChannel}
        onClick={(channel: TelegramChannel) => setSelectedChannel(channel)}
        loadOnlyMyChannels={false}
      />
      <div
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          width: "100%",
          textAlign: "center",
          marginTop: 30,
        }}
      >
        Выберите дату публикации. Если дата не выбрана, пост будет отправлен
        через 1 час
      </div>
      <Modal
        open={isDatePickerModalOpen}
        onCancel={() => setIsDatePickerModalOpen(false)}
        footer={null}
        centered
      >
        <Input
          placeholder="Дата публикации"
          type="datetime-local"
          value={toDatetimeLocalValue(selectedScheduleDate || "")}
          onChange={(e) => {
            const localDate = new Date(e.target.value);
            setSelectedScheduleDate(localDate);
          }}
          style={{ marginTop: "1rem", color: "var(--text-color)" }}
        />
      </Modal>
    </Modal>
  );
};

export default ModalSendPostNow;
