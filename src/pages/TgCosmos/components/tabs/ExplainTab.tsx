import React, { useState } from "react";
import TopicGetter from "../GeneratePost/TopicGetter/TopicGetter";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import { setTopic } from "../../../../features/currentTopicSlice";
import { API_URL } from "../../../../config";

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
      .get(API_URL + "getRandomTerm", {
        withCredentials: true,
      })
      .then((response) => {
        dispatch(setTopic(response.data.term));
        setLoading(false);
        setTopicError(false);
      })
      .catch((_) => {
        setLoading(false);
        setTopicError(true);
        // console.log(error);
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
    </div>
  );
};

export default ExplainTab;
