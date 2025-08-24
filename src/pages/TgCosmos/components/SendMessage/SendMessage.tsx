import { useState } from "react";
import "./SendMessage.scss";
import { Ban } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import Button from "../../../../components/custom-components/custom-button";
import { useNotify } from "../../../../hooks/useNotify";
import SendPostNotification from "./SendPostNotification/SendPostNotification";

const SendMessage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loadingDone, setLoadingDone] = useState(false);

  const { notify, contextHolder } = useNotify();

  const selectedVideos = useAppSelector(
    (state) => state.currentVideo.selectedVideos
  );
  const { ai_response, ai_loading } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);

  const handleSendPost = async () => {
    if (!ai_response) return;

    // Сбрасываем состояние перед новой отправкой
    setLoading(true);
    setProgress(0);
    setLoadingDone(false);
    setError(null);

    const formData = new URLSearchParams();
    formData.append("message", ai_response);

    // Отправка изображений
    const photosArray = selectedImages?.map((image) => image.url) || [];
    if (photosArray.length > 0) {
      formData.append("photos", JSON.stringify(photosArray));
    }

    // Формируем массив ссылок на видео
    const videoUrls = selectedVideos
      .map((video) => video.fullUrl)
      .filter((url): url is string => !!url); // фильтруем undefined/null
    if (videoUrls.length > 0) {
      formData.append("videos", JSON.stringify(videoUrls));
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        }
      );

      if (!response.body) {
        console.error("Нет SSE потока");
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n\n").forEach((msg) => {
          if (!msg.trim()) return;

          const [rawEvent, rawData] = msg.split("\n");
          const event = rawEvent.replace("event: ", "").trim();
          const data = JSON.parse(rawData.replace("data: ", ""));

          if (event === "progress") {
            setProgress(data.progress);
          } else if (event === "done") {
            setLoadingDone(true);
            notify({
              title: "Пост успешно отправлен!",
              body: (
                <SendPostNotification
                  aiText={ai_response || ""}
                  videosSent={data.details.videosSent}
                  photosSent={data.details.photosSent}
                />
              ),
              type: "success",
            });
            setLoading(false);
          } else if (event === "error") {
            setLoadingDone(true);
            setError(new Error(data.error || "Неизвестная ошибка"));
            setLoading(false);
          }
        });
      }
    } catch (err) {
      console.error("Ошибка отправки поста", err);
      setError(err instanceof Error ? err : new Error("Неизвестная ошибка"));
      setLoadingDone(true);
      setLoading(false);
    }
  };

  const renderButtonText = () => {
    if (error) return "Ошибка";
    if (progress > 0 && !loadingDone) return `${Math.round(progress * 100)}%`;
    if (ai_loading) return "Генерация поста";
    return "Отправить пост";
  };

  return (
    <div className="send-post-wrapper">
      {contextHolder}

      <Button
        type="primary"
        className={`send-post-button ${error ? "send-post-button--error" : ""}`}
        onClick={handleSendPost}
        disabled={!ai_response || loading || ai_loading}
        loading={loading || ai_loading}
        icon={error ? <Ban width={20} /> : null}
      >
        {renderButtonText()}
      </Button>

      {error && (
        <div className="error-message">
          Ошибка при отправке поста: {error.message}
        </div>
      )}
    </div>
  );
};

export default SendMessage;
