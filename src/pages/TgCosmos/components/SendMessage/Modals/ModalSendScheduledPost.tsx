import { Input, Modal } from "antd";
import React from "react";
import { TelegramChannel } from "../../../../../types/telegram-channel";
import { SendHorizonal } from "lucide-react";
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
  const { notify, contextHolder } = useNotify();
  const [selectedScheduleDate, setSelectedScheduleDate] =
    React.useState<Date>();
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
      const localDate = selectedScheduleDate ?? new Date();

      // Переводим в UTC с учётом смещения клиента
      const timestamp = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60 * 1000
      ).toISOString();
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
            <span>Отправить отложенный пост</span>
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
      onOk={handleSendScheduledPost}
    >
      {contextHolder}
      <ChannelsTab
        selectedChannel={selectedChannel}
        onClick={(channel: TelegramChannel) => setSelectedChannel(channel)}
        loadOnlyMyChannels={false}
      />
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
  );
};

export default ModalSendPostNow;
