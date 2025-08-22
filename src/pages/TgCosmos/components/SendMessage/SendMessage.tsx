import { useState } from "react";
import "./SendMessage.scss";
import { Ban } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import axios, { AxiosError } from "axios";
import Button from "../../../../components/custom-components/custom-button";
import { useNotify } from "../../../../hooks/useNotify";
import SendPostNotification from "./SendPostNotification/SendPostNotification";

const SendMessage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const { notify, contextHolder } = useNotify();

  const currentVideo = useAppSelector((state) => state.currentVideo.video);
  const { ai_response, ai_loading } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);

  const handleSendPost = async () => {
    if (ai_response) {
      try {
        setLoading(true);
        const formData = new URLSearchParams();
        formData.append("message", ai_response);

        // Отправка изображений
        const photosArray = selectedImages?.map((image) => image.url) || [];
        if (photosArray.length > 0) {
          formData.append("photos", JSON.stringify(photosArray));
        }

        // Отправка информации о видео, если оно есть
        if (currentVideo && Object.keys(currentVideo).length > 0) {
          formData.append("videos", JSON.stringify(currentVideo.fullUrl) || "");
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}sendMessage`,
          formData.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        console.log(response.data);
        notify({
          title: "Пост успешно отправлен!",
          body: (
            <SendPostNotification
              aiText={ai_response || ""}
              videosSent={response.data.details.videosSent}
              photosSent={response.data.details.photosSent}
            />
          ),
          type: "success",
        });
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error sending post", err);
        if (axios.isAxiosError(err)) {
          setError(err);
        } else {
          setError(null);
        }
        setLoading(false);
      }
    }
  };

  return (
    <div className="send-post-wrapper">
      {contextHolder}
      <span className="send-post__error-message">
        {error &&
          "Произошла ошибка при отправке поста: " +
            (axios.isAxiosError(error) && error.response?.data
              ? (error.response.data as { details?: string }).details ||
                error.message
              : error instanceof Error
              ? error.message
              : "Неизвестная ошибка")}
      </span>
      <Button
        type="primary"
        className="send-post-button"
        onClick={handleSendPost}
        disabled={!ai_response || loading || ai_loading}
        loading={loading || ai_loading}
        style={{ backgroundColor: error ? "red" : undefined }}
        icon={error ? <Ban width={20} /> : null}
      >
        {error
          ? "Произошла ошибка"
          : ai_loading
          ? "Генерация поста"
          : "Отправить пост"}
      </Button>
    </div>
  );
};

export default SendMessage;
