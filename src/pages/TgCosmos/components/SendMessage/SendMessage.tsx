import { useState } from "react";
import "./SendMessage.scss";
import { Ban } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import axios, { AxiosError } from "axios";
import Button from "../../../../components/custom-components/custom-button";

const SendMessage = () => {
  const { ai_response, ai_loading } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const handleSendPost = async () => {
    if (ai_response) {
      try {
        setLoading(true);
        const formData = new URLSearchParams();
        formData.append("message", ai_response);

        const photosArray = selectedImages?.map((image) => image.url) || [];
        if (photosArray.length > 0) {
          formData.append("photos", JSON.stringify(photosArray));
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
