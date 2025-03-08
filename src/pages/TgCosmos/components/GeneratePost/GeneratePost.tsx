import "./GeneratePost.scss";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import { setTopic } from "../../../../features/currentTopic";
import { useState } from "react";
import useGetImages from "../../../../hooks/useGetImages";
import TopicGetter from "./TopicGetter/TopicGetter";
import CharacterSetter from "./CharacterSetter/CharacterSetter";
import AiAnswer from "./AiAnswer/AiAnswer";

const GeneratePost = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [topicError, setTopicError] = useState<boolean>(false);
  const [inputTopic, setInputTopic] = useState<string>("");

  const topic = useAppSelector((state) => state.topic.topic);
  const dispatch = useAppDispatch();

  const { fetchImages } = useGetImages();

  const getTopic = () => {
    setLoading(true);
    axios
      .get(import.meta.env.VITE_API_URL + "/getRandomTerm")
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

  const handleGetTopic = () => {
    getTopic();
    fetchImages();
  };

  return (
    <div className="generate-post-wrapper">
      <div className="generate-post-control">
        <TopicGetter
          loading={loading}
          topicError={topicError}
          topic={topic}
          handleGetTopic={handleGetTopic}
          setInputTopic={setInputTopic}
          inputTopic={inputTopic}
        />
        <CharacterSetter />
      </div>
      <div className="divider"></div>
      <AiAnswer />
    </div>
  );
};

export default GeneratePost;
