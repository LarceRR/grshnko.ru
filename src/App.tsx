import { Route, Routes } from "react-router-dom";
import TgCosmos from "./pages/TgCosmos/TgCosmos";
import Other from "./pages/Other/Other";
import AllPosts from "./pages/TgCosmos/components/AllPosts/AllPosts";
import AuthPage from "./pages/AuthPage/AuthPage";

export const App = () => {
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

// Мой проект - телеграмм канал, который каждый день публикует по 4-5 постов о разных космических и физических явлениях.

// Напиши описание или подпись к посту в Телеграм в нескольких предложениях для поста. Если идет перечисление - используй эмоджи с цифрами для пунктов, используй лучшие хештеги телеграмма для этого поста. Первое предложение заголовка должно зацепить читателя (разжечь его любопытство), и, пожалуйста, не начинай предложение со слов «Вам интересно?». Новые абзацы с новой строки. Тема поста - Звездный нуклеосинтез. Не заканчивай пост вопросом. Отвечай только постом.
// Минимум 600 и максимум 800 символов. Записать весь вывод на русском.

// 10% иронии

// Сгенерируй мне 10 терминов о космосе, физике и химией, но связанных между собой. Ответ должен быть в JSON {"terms": [здесь объекты с id и term]}
