import React from "react";
import "./DecodeText.scss";

interface DecodeTextProps {
  text: string;
}

const DecodeText: React.FC<DecodeTextProps> = ({ text }) => {
  // Декодируем HTML-сущности
  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  // Обрабатываем текст: создаем массив ReactNode с хештегами
  const renderTextWithHashtags = (rawText: string) => {
    const decodedText = decodeHtml(rawText);

    // Разбиваем на части по хештегам
    const parts = decodedText.split(/(#[\wа-яёА-ЯЁ]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="hashtag">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <>{renderTextWithHashtags(text)}</>;
};

export default DecodeText;
