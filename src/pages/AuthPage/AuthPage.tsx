// pages/AuthPage.tsx
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshToken = searchParams.get("u"); // получаем refreshToken из query

  useEffect(() => {
    if (!refreshToken) return;

    const refreshSession = async () => {
      try {
        // Отправляем refreshToken на сервер
        await axios.post(
          "https://core.grshnko.ru/api/sessions/refresh",
          { refreshToken },
          {
            withCredentials: true, // чтобы сервер мог поставить HttpOnly cookie
          }
        );

        // После успешного обновления токенов делаем редирект на нужную страницу
        navigate("/"); // или любой маршрут на основном сайте
      } catch (err) {
        console.error("Не удалось обновить сессию", err);
        window.location.href = "https://core.grshnko.ru/";
      }
    };

    refreshSession();
  }, [refreshToken, navigate]);

  return <div>Идет вход...</div>;
};

export default AuthPage;
