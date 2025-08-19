import React from "react";

interface AiAnswerHeaderProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AiAnswerHeader: React.FC<AiAnswerHeaderProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="generate-post-result__header">
      <div className="header-title">
        <p>{title}</p>
        <span>{subtitle}</span>
      </div>
      <div className="generate-post-result__header-buttons">{children}</div>
    </div>
  );
};
