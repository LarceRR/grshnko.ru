import { useCallback, useEffect, useRef, useState } from "react";
import { Square, CloudAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import useAiController from "./useAiController";
import { GenerateButtonConfig } from "../types/aiAnswer";
import { setAiResponse } from "../features/aiResponceSlice";

export const useAiAnswer = () => {
  const { ai_response, ai_loading, ai_error, ai_isMarkdownLocked } =
    useAppSelector((state) => state.ai_response);
  const { topic } = useAppSelector((state) => state.topic);
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(true);
  const textAreaWrapperRef = useRef<HTMLDivElement>(null);

  const aiPrompt = `Объясни, что такое - ${topic.term} будто ты пишешь пост для телеграм-канала. От 600 до 800 символов. Тему поста и интересные детали выдели жирным, но выбирай ооочень точечно, чтобы было 10-20% жирного текста. Не добавляй свои комментарии. Представь, что ты лучший в мире эксперт в социальных сетях. Пост должен быть цепляющим. Аудитория возрастом от 15 до 70 лет. Ты должен быть серьезным. Не используй эмоджи. Твоя сфера - космос, природа, физика, химия, биология и прочие науки. Начни пост с определения. Добавь 5 лучших хештегов по теме (не пиши "Хештеги:")`;

  const { generatePost, cancelGeneration } = useAiController({
    prompt: aiPrompt,
    onGenerating: () => console.log("Генерация началась"),
    onGenerated: (response) => console.log("Генерация завершена:", response),
    onError: (error) => console.error("Произошла ошибка:", error),
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textAreaWrapperRef.current &&
        !textAreaWrapperRef.current.contains(event.target as Node)
      ) {
        setIsEditing(true);
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleGenerate = useCallback(() => {
    if (ai_loading) {
      cancelGeneration();
    } else {
      generatePost();
    }
  }, [ai_loading, generatePost, cancelGeneration]);

  const handleToggleEdit = useCallback(() => {
    if (!ai_isMarkdownLocked) {
      setIsEditing((prev) => !prev);
    }
  }, [ai_isMarkdownLocked]);

  const handleTextChange = useCallback(
    (value: string) => {
      dispatch(setAiResponse(value));
    },
    [dispatch]
  );

  const getButtonConfig = useCallback((): GenerateButtonConfig => {
    if (ai_loading) {
      return {
        text: "Остановить",
        icon: <Square width={20} />,
        loading: true,
      };
    }
    if (ai_error) {
      return {
        text: "Сгенерировать снова",
        icon: <CloudAlert width={20} />,
        style: { backgroundColor: "red" },
      };
    }
    return {
      icon: <img src="/openai.svg" alt="OpenAI" />,
      loading: false,
    };
  }, [ai_loading, ai_error]);

  return {
    aiResponse: ai_response,
    isLoading: ai_loading,
    isError: ai_error,
    isMarkdownLocked: ai_isMarkdownLocked,
    isEditing,
    textAreaWrapperRef,
    handleGenerate,
    handleToggleEdit,
    handleTextChange,
    buttonConfig: getButtonConfig(),
  };
};
