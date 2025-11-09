import { useCallback, useEffect, useRef, useState } from "react";
import { Square, CloudAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import useAiController from "./useAiController";
import { GenerateButtonConfig } from "../types/aiAnswer";
import { setAiResponse } from "../features/aiResponceSlice";
import {
  AIModelType,
  rawData,
} from "../pages/TgCosmos/components/GeneratePost/AiAnswer/ai-models-array";
import { useNotify } from "./useNotify";

const MODEL_STORAGE_KEY = "ai-answer-selected-model";

const getDefaultModel = (): AIModelType => {
  const fallback =
    rawData.find(
      (model) => model.modelId === "deepseek/deepseek-chat-v3-0324:free"
    ) ?? rawData[0];

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedModelId = localStorage.getItem(MODEL_STORAGE_KEY);
    if (!storedModelId) {
      return fallback;
    }
    const storedModel =
      rawData.find((model) => model.modelId === storedModelId) ?? fallback;
    return storedModel;
  } catch (error) {
    console.error("Ошибка загрузки модели AI из localStorage:", error);
    return fallback;
  }
};

export const useAiAnswer = () => {
  const { ai_response, ai_loading, ai_error } = useAppSelector(
    (state) => state.ai_response
  );
  const { topic } = useAppSelector((state) => state.topic);
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(true);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [model, setModelState] = useState<AIModelType>(getDefaultModel);
  const textAreaWrapperRef = useRef<HTMLDivElement>(null);

  const { notify, contextHolder } = useNotify();

  const { generatePost, cancelGeneration } = useAiController({
    model: model,
    prompt: aiPrompt,
    // onGenerating: () => console.log("Генерация началась"),
    // onGenerated: (response) => console.log("Генерация завершена:", response),
    onError: (error) => {
      notify({
        title: "Ошибка",
        body: error.message,
        type: "error",
      });
    },
  });

  useEffect(() => {
    setAiPrompt(``);
  }, [topic.term]);

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
        style: { backgroundColor: "var(--color-red)" },
      };
    }
    return {
      text: model.text,
      icon: <img src={model.icon ?? "/openai.svg"} alt={model.text} />,
      loading: false,
    };
  }, [ai_loading, ai_error, model]);

  const setModel = useCallback((newModel: AIModelType) => {
    setModelState(newModel);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MODEL_STORAGE_KEY, newModel.modelId);
      } catch (error) {
        console.error("Ошибка сохранения модели AI в localStorage:", error);
      }
    }
  }, []);

  return {
    aiResponse: ai_response,
    isLoading: ai_loading,
    isError: ai_error,
    isEditing,
    contextHolder,
    textAreaWrapperRef,
    aiPrompt,
    setModel,
    setAiPrompt,
    model,
    handleGenerate,
    handleTextChange,
    buttonConfig: getButtonConfig(),
  };
};
