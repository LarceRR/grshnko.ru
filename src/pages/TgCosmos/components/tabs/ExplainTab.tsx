import React, { useState } from "react";
import TopicGetter from "../GeneratePost/TopicGetter/TopicGetter";
import CharacterSetter from "../GeneratePost/CharacterSetter/CharacterSetter";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import { setTopic } from "../../../../features/currentTopicSlice";

interface IExplainTabProps {}

const ExplainTab: React.FC<IExplainTabProps> = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [topicError, setTopicError] = useState<boolean>(false);
  const [inputTopic, setInputTopic] = useState<string>("");
  const topic = useAppSelector((state) => state.topic.topic);
  const dispatch = useAppDispatch();

  const getTopic = () => {
    setLoading(true);
    axios
      .get(import.meta.env.VITE_API_URL + "getRandomTerm")
      .then((response) => {
        dispatch(setTopic(response.data.term));
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
    <div className="generate-post-control">
      <TopicGetter
        loading={loading}
        topicError={topicError}
        topic={topic}
        handleGetTopic={getTopic}
        setInputTopic={setInputTopic}
        inputTopic={inputTopic}
      />
      <CharacterSetter />
    </div>
  );
};

export default ExplainTab;
