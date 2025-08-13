import TextArea from "antd/es/input/TextArea";
import { debounce } from "lodash";
import React, { useCallback } from "react";
import { setParaphrase } from "../../../../features/currentParaphraseArticleSlice";
import { useAppDispatch } from "../../../../store/hooks";

interface IParaphraseTabProps {}

const ParaphraseTab: React.FC<IParaphraseTabProps> = () => {
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

  return (
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
  );
};

export default ParaphraseTab;
