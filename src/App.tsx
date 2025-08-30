// App.tsx
import { Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import TgCosmos from "./pages/TgCosmos/TgCosmos";
import Other from "./pages/Other/Other";
import AllPosts from "./pages/TgCosmos/components/AllPosts/AllPosts";
import { AuthPage } from "./pages/AuthPage/AuthPage";
import { AppDispatch } from "./store/store";
import { fetchUser } from "./features/authSlice";

export const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Проверяем сессию и подгружаем пользователя при заходе
    dispatch(fetchUser());
  }, [dispatch]);

  return (
    <div className="router-wrapper">
      <Routes>
        <Route path="/" element={<TgCosmos />} />
        <Route path="/tgcosmos/allPosts" element={<AllPosts />} />
        <Route path="/other" element={<Other />} />
        <Route path="/auth/callback" element={<AuthPage />} />
      </Routes>
    </div>
  );
};
