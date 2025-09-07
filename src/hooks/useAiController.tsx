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
    // Отменяем предыдущий запрос, если он существует
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController для текущего запроса
    abortControllerRef.current = new AbortController();

    try {
      // Устанавливаем начальные состояния
      dispatch(setAiLoading(true));
      dispatch(setIsAiAlreadyAsked(true));
      dispatch(setAiResponse(""));
      dispatch(setAiError(""));
      dispatch(setAiIsMarkdownLocked(false));

      // Вызываем колбэк начала генерации
      onGenerating?.();

      // Формируем URL запроса
      const url = new URL(`${API_URL}generate`);
      url.searchParams.set("message", prompt);
      url.searchParams.set("personality", character);
      url.searchParams.set("model", model.modelId);

      // Выполняем запрос к серверу с поддержкой отмены
      const response = await fetch(url.toString(), {
        signal: abortControllerRef.current.signal,
        credentials: "include",
      });

      // Проверяем статус ответа
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json(); // читаем JSON с сервера
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // игнорируем ошибки парсинга JSON
        }
        throw new Error(errorMessage);
      }

      // Проверяем поддержку ReadableStream
      if (!response.body) {
        throw new Error("ReadableStream не поддерживается");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedData = "";

      // Читаем данные по чанкам
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Декодируем чанк и добавляем его к накопленным данным
        const chunk = decoder.decode(value, { stream: true });
        accumulatedData += chunk;

        // Обновляем состояние с новыми данными
        dispatch(setAiResponse(accumulatedData));
      }

      // Завершаем загрузку и разрешаем редактирование
      dispatch(setAiLoading(false));
      dispatch(setIsAiAlreadyAsked(false));
      dispatch(setAiIsMarkdownLocked(false));

      // Вызываем колбэк успешной генерации
      onGenerated?.(accumulatedData);
    } catch (err) {
      // Игнорируем ошибки отмены запроса
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      // Обрабатываем другие ошибки
      console.error("Ошибка при генерации поста:", err);

      dispatch(setAiLoading(false));
      dispatch(setIsAiAlreadyAsked(false));

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла неизвестная ошибка при генерации поста";

      dispatch(setAiError(errorMessage));
      dispatch(setAiIsMarkdownLocked(false));

      // Вызываем колбэк ошибки
      if (err instanceof Error) {
        onError?.(err);
      } else {
        onError?.(new Error(String(err)));
      }
    } finally {
      // Очищаем ссылку на AbortController
      abortControllerRef.current = null;
    }
  }, [prompt, character, dispatch, onGenerating, onGenerated, onError]);

  // Функция для отмены текущей генерации
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
