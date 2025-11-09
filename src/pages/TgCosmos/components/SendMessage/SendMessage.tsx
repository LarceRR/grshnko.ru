import { useState, useCallback } from "react";
import "./SendMessage.scss";
import { Ban, CalendarClock, SendHorizonal } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import Button from "../../../../components/custom-components/custom-button";
import {
  defaultChannel,
  TelegramChannel,
} from "../../../../types/telegram-channel";
import ModalSendPostNow from "./Modals/ModalSendPostNow";
import ModalSendScheduledPost from "./Modals/ModalSendScheduledPost";
import { useHashtagsHistory } from "../../../../components/MarkdownEditor/hooks/useHashtagsHistory";
import { extractCompletedHashtags } from "../../../../components/MarkdownEditor/utils/hashtags";
import { setActiveChannel } from "../../../../features/selectedChannelSlice";

const SendMessage = () => {
  const [modalScheduledPostLoading, setModalScheduledPostLoading] =
    useState(false);
  const [modalScheduledPostError, setModalScheduledPostError] =
    useState<Error | null>(null);

  const [modalPostLoading, setModalPostLoading] = useState(false);
  const [modalPostError, setModalPostError] = useState<Error | null>(null);

  const [progress, setProgress] = useState(0);
  const [infoText, setInfoText] = useState("");
  const [selectedChannel, setSelectedChannel] =
    useState<TelegramChannel>(defaultChannel);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalOpenScheduled, setModalOpenScheduled] = useState(false);

  const dispatch = useAppDispatch();
  const selectedVideos = useAppSelector(
    (state) => state.currentVideo.selectedVideos
  );
  const { ai_response, ai_loading, post_entities } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);
  const { addToHistory } = useHashtagsHistory();

  const handleSelectedChannelChange = useCallback(
    (channel: TelegramChannel) => {
      setSelectedChannel(channel);
      dispatch(setActiveChannel(channel));
    },
    [dispatch]
  );

  const handleHashtagsSave = useCallback(
    (text: string) => {
      if (!text) {
        return;
      }
      const completedHashtags = extractCompletedHashtags(text);
      completedHashtags.forEach((tag) => addToHistory(tag));
    },
    [addToHistory]
  );

  const renderSheduledButtonText = () => {
    if (modalScheduledPostError)
      return `${modalScheduledPostError.message || "Повторите попытку"} `;
    if (modalScheduledPostLoading && progress > 0)
      return `${progress}% ${infoText}`;
    if (ai_loading) return "Генерация поста";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div>
          <span>Отложить пост</span>
          <p style={{ fontSize: 12 }}>
            {selectedChannel?.entity?.username
              ? `в @${selectedChannel?.entity?.username}`
              : `в ID: ${selectedChannel.id}`}
          </p>
        </div>
        <CalendarClock size={20} />
      </div>
    );
  };

  const renderButtonText = () => {
    if (modalPostError)
      return `${modalPostError.message || "Повторите попытку"} `;
    if (modalPostLoading && progress > 0) return `${progress}% ${infoText}`;
    if (ai_loading) return "Генерация поста";
    return (
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
    );
  };

  return (
    <div className="send-post-wrapper">
      <div className="send-post-wrapper__subwrapper">
        <ModalSendPostNow
          post_entities={post_entities}
          setInfoText={setInfoText}
          setProgress={setProgress}
          setError={setModalPostError}
          setLoading={setModalPostLoading}
          error={modalPostError}
          loading={modalPostLoading}
          ai_response={ai_response}
          selectedImages={selectedImages}
          selectedVideos={selectedVideos}
          isModalOpen={isModalOpen}
          setModalOpen={setModalOpen}
          selectedChannel={selectedChannel}
          setSelectedChannel={handleSelectedChannelChange}
          onPostSent={handleHashtagsSave}
        />

        <ModalSendScheduledPost
          post_entities={post_entities}
          setError={setModalScheduledPostError}
          setLoading={setModalScheduledPostLoading}
          error={modalScheduledPostError}
          loading={modalScheduledPostLoading}
          ai_response={ai_response}
          selectedImages={selectedImages}
          selectedVideos={selectedVideos}
          isModalOpen={isModalOpenScheduled}
          setModalOpen={setModalOpenScheduled}
          selectedChannel={selectedChannel}
          setSelectedChannel={handleSelectedChannelChange}
          onPostSent={handleHashtagsSave}
        />

        <Button
          type="primary"
          className="send-post-button"
          error={modalScheduledPostError?.message}
          onClick={() => setModalOpenScheduled(true)}
          disabled={modalScheduledPostLoading || ai_loading}
          loading={modalScheduledPostLoading || ai_loading}
          icon={modalScheduledPostError ? <Ban width={20} /> : null}
        >
          {renderSheduledButtonText()}
        </Button>

        <Button
          type="primary"
          className="send-post-button"
          error={modalPostError?.message}
          onClick={() => setModalOpen(true)}
          disabled={modalPostLoading || ai_loading}
          loading={modalPostLoading || ai_loading}
          icon={modalPostError ? <Ban width={20} /> : null}
        >
          {renderButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default SendMessage;
