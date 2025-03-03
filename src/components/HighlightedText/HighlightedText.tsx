import React from "react";
import "./HighlightedText.scss";

interface IHighlightedTextProps {
  children: React.ReactNode;
  color: string;
}

const HighlightedText: React.FC<IHighlightedTextProps> = ({
  children,
  color,
}) => {
  return (
    <div
      className="highlighted-text"
      style={{
        color: color,
        border: `1px solid ${color}`,
        backgroundColor: `${color}20`,
      }}
    >
      {children}
    </div>
  );
};

export default HighlightedText;
