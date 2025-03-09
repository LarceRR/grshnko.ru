import { Button } from "antd";
import TextArea from "antd/es/input/TextArea";
import { Ban, Ellipsis } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import useAiController from "../../../../../hooks/useAiController";
import {
  setAiIsMarkdownLocked,
  setAiResponse,
} from "../../../../../features/ai_response";
import Markdown from "react-markdown";

const AiAnswer: React.FC = () => {
  const {
    ai_response,
    ai_loading,
    ai_error,
    ai_isMarkdownLocked, // Используем ai_isMarkdownLocked вместо ai_isTextAreaAllowedToEdit
  } = useAppSelector((state) => state.ai_response);
  const { generatePostByTopic } = useAiController();
  const dispatch = useAppDispatch();
  const textAreaWrapperRef = useRef<HTMLDivElement>(null); // Реф на обёртку

  // Локальное состояние для переключения между Markdown и Textarea
  const [isMarkdown, setIsMarkdown] = useState(true);

  // Обработчик клика вне области Textarea
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textAreaWrapperRef.current &&
        !textAreaWrapperRef.current.contains(event.target as Node)
      ) {
        setIsMarkdown(true); // Переключаем обратно на Markdown
        dispatch(setAiIsMarkdownLocked(true)); // Блокируем Textarea
      }
    };

    if (!ai_isMarkdownLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ai_isMarkdownLocked, dispatch]);

  // Обработчик изменения текста в Textarea
  const handleEditAfterDone = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setAiResponse(e.target.value));
  };

  // Обработчик переключения на Textarea
  const handleSetEdit = () => {
    if (!ai_isMarkdownLocked) {
      setIsMarkdown(false); // Переключаем на Textarea
      dispatch(setAiIsMarkdownLocked(false)); // Разблокируем Textarea
    }
  };

  return (
    <div className="generate-post-result">
      <div className="generate-post-result__header">
        <p>Ответ нейросети</p>
        <div className="generate-post-result__header-buttons">
          <Button
            className="create-new-post"
            onClick={generatePostByTopic}
            loading={ai_loading}
            icon={ai_error ? <Ban width={20} /> : ""}
            style={{ backgroundColor: ai_error ? "red" : "" }}
          >
            {ai_loading ? "Генерация..." : "Сгенерировать пост"}
          </Button>
          <Ellipsis />
        </div>
      </div>

      {/* Отображение Markdown или Textarea */}
      {isMarkdown ? (
        <div
          className="generate-post-input generate-post-input-wrapper"
          style={{ paddingInline: "10px", paddingTop: "6px" }}
          onClick={handleSetEdit}
        >
          <Markdown>{ai_response}</Markdown>
        </div>
      ) : (
        <div ref={textAreaWrapperRef} style={{ height: "100%" }}>
          <TextArea
            showCount
            className="generate-post-input"
            maxLength={1500}
            style={{ resize: "none" }}
            value={ai_response}
            onChange={handleEditAfterDone}
          />
        </div>
      )}
    </div>
  );
};

export default AiAnswer;
