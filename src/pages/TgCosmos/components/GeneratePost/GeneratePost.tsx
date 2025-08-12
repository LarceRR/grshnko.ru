import "./GeneratePost.scss";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import axios from "axios";
import { setTopic } from "../../../../features/currentTopicSlice";
import { useState, useCallback } from "react";
import TopicGetter from "./TopicGetter/TopicGetter";
import CharacterSetter from "./CharacterSetter/CharacterSetter";
import AiAnswer from "./AiAnswer/AiAnswer";
import TextArea from "antd/es/input/TextArea";
import { setParaphrase } from "../../../../features/currentParaphraseArticleSlice";
import { debounce } from "lodash";

const GeneratePost = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [topicError, setTopicError] = useState<boolean>(false);
  const [inputTopic, setInputTopic] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"paraphrase" | "explain">(
    "explain"
  );

  const topic = useAppSelector((state) => state.topic.topic);
  const dispatch = useAppDispatch();

  // Добавляем debounce для setParaphraseArticle
  const debouncedSetParaphrase = useCallback(
    debounce((article: string) => {
      // console.log(article);
      dispatch(setParaphrase(article));
    }, 500), // Задержка 500ms
    [dispatch]
  );

  const setParaphraseArticle = (article: string) => {
    debouncedSetParaphrase(article);
  };

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
    <div className="generate-post-wrapper">
      <div>
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "explain" ? "active" : ""}`}
            onClick={() => setActiveTab("explain")}
          >
            Рассказать о теме
          </button>
          <div className="divider"></div>
          <button
            className={`tab-button ${
              activeTab === "paraphrase" ? "active" : ""
            }`}
            onClick={() => setActiveTab("paraphrase")}
          >
            Перефразировать
          </button>
        </div>

        {activeTab === "explain" ? (
          <>
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
          </>
        ) : (
          <div className="generate-post-buttons paraphrase">
            <p>Введите текст, который хотите перефразировать</p>
            <TextArea
              showCount
              className="generate-post-input"
              maxLength={5000}
              style={{ height: "550px", resize: "none" }}
              onChange={(e) => setParaphraseArticle(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="divider"></div>
      <AiAnswer />
    </div>
  );
};

export default GeneratePost;
