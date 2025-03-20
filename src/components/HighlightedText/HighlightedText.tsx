import React from "react";
import "./HighlightedText.scss";

interface IHighlightedTextProps {
  children?: React.ReactNode;
  color?: string;
  state: boolean;
}

const HighlightedText: React.FC<IHighlightedTextProps> = ({ state }) => {
  return (
    <div
      className="highlighted-text"
      style={{
        color: state ? "#59ff56" : "ff0000",
        border: `1px solid ${state ? "#59ff56" : "#ff0000"}`,
        backgroundColor: `${state ? "#59ff56" : "ff0000"}40`,
      }}
    >
      {state ? "Онлайн" : "Оффлайн"}
    </div>
  );
};

export default HighlightedText;
