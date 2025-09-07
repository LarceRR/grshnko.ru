import axios from "axios";
import { useState } from "react";
import { Message, Messages } from "../types/postTypes";
import { useDispatch } from "react-redux";
import { ITelegram, updateServerStatus } from "../features/systemStatusSlice";
import { API_URL } from "../config";

export interface IAxiosServerResponse {
  messages: Message[];
  serverData: ITelegram;
}

const usePostController = () => {
  const [posts, setPosts] = useState<Messages | null>(null);
  const [popularPosts, setPopularPosts] = useState<Message[] | null>(null);
  const [postPhotos, setPostPhotos] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();

  const getAllPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<IAxiosServerResponse>(
        `${API_URL}getAllMessages?channel=@saycosmos`,
        {
          withCredentials: true,
        }
      );
      setPosts(response.data); // Устанавливаем данные из ответа
      // console.log(response);
    } catch (err) {
      setError("Ошибка при загрузке постов");
      console.error(err); // Логируем ошибку
    } finally {
      setLoading(false); // Завершаем загрузку
    }
  };

  const getPostPhotos = async (message: Message) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}getPostPhotos`,
        { messageId: message.id, channel: "@saycosmos" }, // Передаем message в теле запроса
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded", // Указываем правильный Content-Type
          },
          responseType: "blob", // Указываем, что ожидаем бинарные данные
        }
      );

      // console.log(response.data);

      // Создаем URL для изображения
      const imageUrl = URL.createObjectURL(new Blob([response.data]));

      // Обновляем состояние с URL изображения
      setPostPhotos(imageUrl);
    } catch (err) {
      setError("Ошибка при загрузке фотографий");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPopularPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<IAxiosServerResponse>(
        `${API_URL}getAllMessages?channel=@saycosmos`
      );

      setPosts(response.data); // Устанавливаем все посты
      dispatch(updateServerStatus(response.data.serverData));
      // console.log(response.data.serverData.telegram.telegram_client_status);

      // Фильтруем посты, у которых есть поле "views"
      const filteredPosts = response.data.messages.filter(
        (post): post is Message => "views" in post
      );

      // Сортируем посты по популярности
      const sortedPopularPosts = filteredPosts.slice().sort((a, b) => {
        const reactionsA = a.reactions?.results.length || 0;
        const reactionsB = b.reactions?.results.length || 0;
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;

        // Варианты расчёта "популярности":
        // 1. Просто сумма (балансированный вариант)
        // return (reactionsB + viewsB) - (reactionsA + viewsA);

        // 2. Взвешенное значение (например, 1 реакция = 10 просмотров)
        return reactionsB * viewsB - reactionsA * viewsA;

        // 3. Произведение (даёт большой приоритет высоковиральным постам)
        // return (reactionsB * viewsB) - (reactionsA * viewsA);
      });

      setPopularPosts(sortedPopularPosts);
    } catch (err) {
      setError("Ошибка при загрузке популярных постов");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    error,
    postPhotos,
    popularPosts,
    getAllPosts,
    getPopularPosts,
    getPostPhotos,
  };
};

export default usePostController;
