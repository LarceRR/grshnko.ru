import { useState } from "react";
import "./SendMessage.scss";
import { Ban } from "lucide-react";
import { Button } from "antd";
import { useAppSelector } from "../../../../store/hooks";
import axios from "axios";

const SendMessage = () => {
  const { ai_response } = useAppSelector((state) => state.ai_response);
  const { selectedImage } = useAppSelector((state) => state.images);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendPost = async () => {
    if (ai_response) {
      try {
        setLoading(true);
        const response = await axios.post(
          "https://api.grshnko.ru/sendMessage",
          // Format the data as x-www-form-urlencoded
          `message=${encodeURIComponent(
            ai_response
          )}&media=${encodeURIComponent(selectedImage)}`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        console.log(response.data);
        setLoading(false); // Handle the response as needed
      } catch (error) {
        console.error("Error sending post:", error);
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
        loading={loading}
        style={{ backgroundColor: error ? "red" : "" }}
        icon={error ? <Ban width={20} /> : null}
      >
        Отправить пост
      </Button>
    </div>
  );
};

export default SendMessage;
