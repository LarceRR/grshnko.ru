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
  const [infoText, setInfoText] = useState<string>("");
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

    setLoading(true);
    setProgress(0);
    setInfoText("");
    setLoadingDone(false);
    setError(null);

    const formData = new URLSearchParams();
    formData.append("message", ai_response);

    const photosArray = selectedImages?.map((i) => i.url) || [];
    if (photosArray.length)
      formData.append("photos", JSON.stringify(photosArray));

    const videoUrls = selectedVideos.map((v) => v.fullUrl).filter(Boolean);
    if (videoUrls.length) formData.append("videos", JSON.stringify(videoUrls));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        }
      );

      if (!response.body) throw new Error("Нет SSE потока");

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

          // Ошибка
          if (data.error) {
            setError(new Error(data.error));
            setLoading(false);
            setLoadingDone(true);
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
    if (loading && progress > 0) return `${progress}% ${infoText}`;
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
