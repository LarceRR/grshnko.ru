import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshToken = searchParams.get("u");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!refreshToken) return;

    const refreshSession = async () => {
      try {
        // Обновляем токены
        await axios.post(
          "https://core.grshnko.ru/api/sessions/refresh",
          { refreshToken },
          { withCredentials: true }
        );

        // Получаем данные пользователя
        const res = await axios.get("https://core.grshnko.ru/api/sessions/me", {
          withCredentials: true, // HttpOnly cookie автоматически отправляется
        });

        console.log("User info:", res.data.user);

        // Можно сохранить в глобальный state или context
        // После успешного входа редирект
        navigate("/");
      } catch (err) {
        console.error("Не удалось обновить сессию", err);
        window.location.href = "https://core.grshnko.ru/";
      } finally {
        setLoading(false);
      }
    };

    refreshSession();
  }, [refreshToken, navigate]);

  return <div>{loading ? "Идет вход..." : "Проблемы с авторизацией"}</div>;
};

export default AuthPage;
