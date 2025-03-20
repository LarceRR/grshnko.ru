import { Input } from "antd";
import { Ban, ArrowRight, Plus } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "../../../../../store/hooks";
import { setTopic } from "../../../../../features/currentTopicSlice";
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
      <span>
        {topic.term ? (
          <AnimatePresence mode="wait">
            <motion.span
              key={topic ? topic.term : "default"}
              initial={{ opacity: 0, scale: 0.8, color: "#888" }}
              animate={{ opacity: 1, scale: 1, color: "#000" }}
              exit={{ opacity: 0, scale: 1.2, color: "#888" }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
              style={{ display: "inline-block", whiteSpace: "nowrap" }}
            >
              {topic.term.split("").map((char: string, index: number) => (
                <motion.span
                  key={char + index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.01, delay: index * 0.03 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        ) : (
          "Тема не выбрана"
        )}
      </span>

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
