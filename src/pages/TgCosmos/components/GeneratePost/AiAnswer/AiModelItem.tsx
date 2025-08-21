import React from "react";
import { AIModelType } from "./ai-models-array";

export type AIModelWithClick = AIModelType & {
  onClick?: () => void;
  icon?: React.ReactNode | string;
};

const AiModelItem: React.FC<AIModelWithClick> = ({
  modelId,
  text,
  onClick,
  icon,
}) => {
  return (
    <div className="ai-model-item" onClick={onClick}>
      <div className="ai-model-item__content">
        <span className="ai-model-item__text">{text}</span>
        <span className="ai-model-item__modelId">{modelId}</span>
      </div>
      {icon && <div className="ai-model-item__icon">{icon}</div>}
    </div>
  );
};

export default AiModelItem;
