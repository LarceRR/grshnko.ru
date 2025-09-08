import { useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  setAiError,
  setAiIsMarkdownLocked,
  setAiLoading,
  setAiResponse,
  setIsAiAlreadyAsked,
} from "../features/aiResponceSlice";
import { useAppSelector } from "../store/hooks";
import { AIModelType } from "../pages/TgCosmos/components/GeneratePost/AiAnswer/ai-models-array";
import { API_URL } from "../config";

interface UseAiControllerProps {
  model: AIModelType;
  prompt: string;
  onGenerating?: () => void;
  onGenerated?: (response: string) => void;
  onError?: (error: Error) => void;
}

const useAiController = ({
  model,
  prompt,
  onGenerating,
  onGenerated,
  onError,
}: UseAiControllerProps) => {
  const dispatch = useDispatch();
  const { character } = useAppSelector((state) => state.character);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generatePost = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      dispatch(setAiLoading(true));
      dispatch(setIsAiAlreadyAsked(true));
      dispatch(setAiResponse(""));
      dispatch(setAiError(""));
      dispatch(setAiIsMarkdownLocked(false));

      onGenerating?.();

      const response = await fetch(`${API_URL}generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          personality: character,
          model: model.modelId,
          generatorType: "custom", // можно менять если нужен preset
        }),
        signal: abortControllerRef.current.signal,
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // игнорируем ошибки парсинга JSON
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("ReadableStream не поддерживается");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedData = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedData += chunk;

        dispatch(setAiResponse(accumulatedData));
      }

      dispatch(setAiLoading(false));
      dispatch(setIsAiAlreadyAsked(false));
      dispatch(setAiIsMarkdownLocked(false));

      onGenerated?.(accumulatedData);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      console.error("Ошибка при генерации поста:", err);

      dispatch(setAiLoading(false));
      dispatch(setIsAiAlreadyAsked(false));

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла неизвестная ошибка при генерации поста";

      dispatch(setAiError(errorMessage));
      dispatch(setAiIsMarkdownLocked(false));

      if (err instanceof Error) onError?.(err);
      else onError?.(new Error(String(err)));
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    prompt,
    character,
    dispatch,
    model.modelId,
    onGenerating,
    onGenerated,
    onError,
  ]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    generatePost,
    cancelGeneration,
  };
};

export default useAiController;
