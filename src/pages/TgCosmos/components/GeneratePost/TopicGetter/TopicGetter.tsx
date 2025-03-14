import { Input } from "antd";
import { Ban, ArrowRight, Plus } from "lucide-react";
import React, { useState } from "react";
import { useAppDispatch } from "../../../../../store/hooks";
import { setTopic } from "../../../../../features/currentTopic";
import Button from "../../../../../components/custom-components/custom-button";
import Checkbox from "../../../../../components/custom-components/custom-checkbox/custom-checkbox";

interface ITopicGetterProps {
  loading: boolean;
  topicError: boolean;
  topic: any;
  handleGetTopic: () => void;
  setInputTopic: (value: string) => void;
  inputTopic: string;
}

const TopicGetter: React.FC<ITopicGetterProps> = ({
  loading,
  topicError,
  topic,
  handleGetTopic,
  setInputTopic,
  inputTopic,
}) => {
  const [isSplitterChecked, setIsSplitterChecked] = useState(false);

  const dispatch = useAppDispatch();

  const setCustomTopic = () => {
    dispatch(
      setTopic({
        eng_term: inputTopic,
        id: 0,
        term: inputTopic,
      })
    );
  };

  return (
    <div className="generate-post-buttons">
      {topic ? topic.term : <p>Тема не выбрана</p>}
      <Button
        type="primary"
        className="generate-post-button"
        onClick={handleGetTopic}
        loading={loading}
        style={{ backgroundColor: topicError ? "red" : "" }}
        icon={topicError ? <Ban width={20} /> : null}
      >
        Выбрать тему
      </Button>
      <Button
        type="primary"
        className="generate-post-button"
        style={{ marginTop: "15px" }}
        disabled
      >
        Выбрать вручную
      </Button>
      <div className="generate-post-button-splitter">
        <Button type="primary" className="generate-post-button" disabled>
          Создать новую тему
        </Button>
        <Checkbox
          checked={isSplitterChecked}
          className="checkbox"
          onChange={() => setIsSplitterChecked(!isSplitterChecked)}
          disabled
        ></Checkbox>
      </div>
      <div className="generate-post-button-splitter">
        <Input
          type="primary"
          className="generate-post-input"
          onChange={(e) => setInputTopic(e.target.value)}
        />
        <Button
          type="primary"
          className="generate-post-button"
          icon={<ArrowRight />}
          style={{ width: "32px" }}
          onClick={setCustomTopic}
        ></Button>

        <Button
          type="primary"
          className="generate-post-button"
          icon={<Plus />}
          style={{ width: "48px" }}
          // onClick={}
        ></Button>
      </div>
    </div>
  );
};

export default TopicGetter;
