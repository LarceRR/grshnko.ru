import { useDispatch } from "react-redux";
import {
  setAiError,
  setAiIsTextAreaAllowedToEdit,
  setAiLoading,
  setAiResponse,
  setIsAiAlreadyAsked,
} from "../features/ai_response";
import { useAppSelector } from "../store/hooks";

const useAiController = () => {
  const dispatch = useDispatch();
  const { topic } = useAppSelector((state) => state.topic);
  const { character } = useAppSelector((state) => state.character);

  const generatePostByTopic = async () => {
    try {
      // Устанавливаем начальные состояния
      dispatch(setAiLoading(true));
      dispatch(setIsAiAlreadyAsked(true));
      dispatch(setAiResponse(""));
      dispatch(setAiError(""));
      dispatch(setAiIsTextAreaAllowedToEdit(false));

      // Формируем URL запроса
      const url = new URL("https://api.grshnko.ru/generate");
      url.searchParams.set(
        "message",
        `Объясни, что такое - ${topic.term} будто ты пишешь пост для телеграм-канала. От 600 до 800 символов. Тему поста и интересные детали выдели жирным, но выбирай ооочень точечно, чтобы было 10-20% жирного текста. Не добавляй свои комментарии. Представь, что ты лучший в мире эксперт в социальных сетях. Пост должен быть цепляющим. Аудитория возрастом от 15 до 70 лет. Ты должен быть серьезным. Не используй эмоджи. Твоя сфера - космос, природа, физика, химия, биология и прочие науки. Начни пост с определения. Добавь 5 лучших хештегов по теме (не пиши "Хештеги:")`
      );
      url.searchParams.set("personality", character);

      // Выполняем запрос к серверу
      const response = await fetch(url.toString());

      // Проверяем поддержку ReadableStream
      if (!response.body) {
        dispatch(setAiError("Не поддерживается стримминг данных"));
        throw new Error("ReadableStream не поддерживается.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedData = "";

      // Читаем данные по чанкам
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Завершаем загрузку и разрешаем редактирование
          dispatch(setAiLoading(false));
          dispatch(setIsAiAlreadyAsked(false));
          dispatch(setAiIsTextAreaAllowedToEdit(true));
          break;
        }

        // Декодируем чанк и добавляем его к накопленным данным
        const chunk = decoder.decode(value, { stream: true });
        accumulatedData += chunk;

        // Обновляем состояние с новыми данными
        dispatch(setAiResponse(accumulatedData));
      }
    } catch (err) {
      // Обрабатываем ошибки
      console.error("Ошибка при генерации поста:", err);
      dispatch(setAiLoading(false));
      dispatch(setIsAiAlreadyAsked(false));
      dispatch(setAiError("Произошла ошибка при генерации поста"));
      dispatch(setAiIsTextAreaAllowedToEdit(true));
    }
  };

  return { generatePostByTopic };
};

export default useAiController;
