import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { fetchUser } from "../../features/authSlice";

export const AuthPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshToken = searchParams.get("u");

  useEffect(() => {
    if (!refreshToken) return;

    const refreshSession = async () => {
      try {
        await axios.post(
          "https://core.grshnko.ru/api/sessions/refresh",
          { refreshToken },
          { withCredentials: true }
        );

        await dispatch(fetchUser());

        navigate("/");
      } catch (err) {
        console.error(err);
        window.location.href = "https://core.grshnko.ru/";
      }
    };

    refreshSession();
  }, [refreshToken, navigate, dispatch]);

  return <div>Идет вход...</div>;
};
