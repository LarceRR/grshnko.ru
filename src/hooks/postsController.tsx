import axios from "axios";
import { useState } from "react";
import { Message, Messages } from "../types/postTypes";

const usePostController = () => {
  const [posts, setPosts] = useState<Messages | null>(null);
  const [popularPosts, setPopularPosts] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAllPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<Messages>(
        "https://api.grshnko.ru/getAllMessages"
      );
      setPosts(response.data); // Устанавливаем данные из ответа
    } catch (err) {
      setError("Ошибка при загрузке постов");
      console.error(err); // Логируем ошибку
    } finally {
      setLoading(false); // Завершаем загрузку
    }
  };

  const getPopularPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<Messages>(
        "https://api.grshnko.ru/getAllMessages"
      );

      setPosts(response.data); // Устанавливаем все посты

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
    popularPosts,
    getAllPosts,
    getPopularPosts,
  };
};

export default usePostController;
