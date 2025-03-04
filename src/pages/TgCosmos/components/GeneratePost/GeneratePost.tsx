import { Button, Checkbox, Input } from "antd";
import "./GeneratePost.scss";
import { Ban, Ellipsis } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import { setTopic } from "../../../../features/currentTopic";
import { useState } from "react";

const { TextArea } = Input;

const GeneratePost = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [topicError, setTopicError] = useState<boolean>(false);

  const topic = useAppSelector((state) => state.topic.topic);
  const dispatch = useAppDispatch();

  const getTopic = () => {
    setLoading(true);
    axios
      .get(import.meta.env.VITE_API_URL + "/getRandomTerm")
      .then((response) => {
        dispatch(setTopic(response.data.term.term));
        setLoading(false);
        setTopicError(false);
      })
      .catch((error) => {
        setLoading(false);
        setTopicError(true);
        console.log(error);
      });
  };

  return (
    <div className="generate-post-wrapper">
      <div className="generate-post-control">
        <div className="generate-post-buttons">
          {topic ? topic : <p>Тема не выбрана</p>}
          <Button
            type="primary"
            className="generate-post-button"
            onClick={getTopic}
            loading={loading}
            style={{ backgroundColor: topicError ? "red" : "" }}
            icon={topicError ? <Ban width={20} /> : null}
          >
            Выбрать тему
          </Button>
          <Button type="primary" className="generate-post-button">
            Выбрать вручную
          </Button>
          <div className="generate-post-button-splitter">
            <Button type="primary" className="generate-post-button">
              Создать новую тему
            </Button>
            <Checkbox className="checkbox"></Checkbox>
          </div>
        </div>
        <div className="generate-post-buttons">
          <p>Задать характер</p>
          <TextArea
            showCount
            className="generate-post-input"
            maxLength={136}
            style={{ height: "150px", resize: "none" }}
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="generate-post-result">
        <div className="generate-post-result__header">
          <p>Ответ нейросети</p>
          <div className="generate-post-result__header-buttons">
            <Button className="create-new-post">Сгенерировать пост</Button>
            <Ellipsis />
          </div>
        </div>
        <TextArea
          showCount
          className="generate-post-input"
          maxLength={1500}
          style={{ resize: "none" }}
          disabled
        />
      </div>
    </div>
  );
};

export default GeneratePost;
