import { useState } from "react";
import "./SendMessage.scss";
import { Ban } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import Button from "../../../../components/custom-components/custom-button";

const SendMessage = () => {
  const { ai_response, ai_loading } = useAppSelector(
    (state) => state.ai_response
  );
  const { selectedImages } = useAppSelector((state) => state.images);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendPost = async () => {
    if (ai_response) {
      try {
        setLoading(true);
        const formData = new URLSearchParams();
        formData.append("message", ai_response);

        const photosArray = selectedImages?.map((image) => image.url) || [];

        if (selectedImages?.length > 0) {
          formData.append("media", JSON.stringify(photosArray));
        }

        const response = await axios.post(
          "https://api.grshnko.ru/sendMessage",
          formData.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        // console.log(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error sending post", error);
        setError("error");
        setLoading(false);
      }
    }
  };

  return (
    <div className="send-post-wrapper">
      <Button
        type="primary"
        className="send-post-button"
        onClick={handleSendPost}
        disabled={!ai_response || loading || ai_loading}
        loading={loading || ai_loading}
        style={{ backgroundColor: error ? "red" : "" }}
        icon={error ? <Ban width={20} /> : null}
      >
        {error
          ? "Произошла ошибка"
          : ai_loading
          ? "Генерация нейросети..."
          : "Отправить пост"}
      </Button>
    </div>
  );
};

export default SendMessage;
