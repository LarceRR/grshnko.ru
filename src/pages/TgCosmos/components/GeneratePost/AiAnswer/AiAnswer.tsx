import React from "react";
import "./AiAnswer.scss";
import { AiAnswerHeader } from "./AiAnswerHeader";
import { GenerateButton } from "./GenerateButton";
import { AiResponseView } from "./AiResponseView";
import { AiResponseEdit } from "./AiResponseEdit";
import { useAiAnswer } from "../../../../../hooks/useAiAnswer";

export const AiAnswer: React.FC = () => {
  const {
    aiResponse,
    isMarkdownLocked,
    isEditing,
    textAreaWrapperRef,
    handleGenerate,
    handleToggleEdit,
    handleTextChange,
    buttonConfig,
  } = useAiAnswer();

  return (
    <div className="generate-post-result ai-answer__wrapper">
      <AiAnswerHeader
        title="Ответ нейросети"
        subtitle="Нажмите на текст для редактирования"
      >
        <GenerateButton {...buttonConfig} onClick={handleGenerate} />
      </AiAnswerHeader>

      {isEditing ? (
        <AiResponseEdit
          content={aiResponse}
          isEditing={isEditing}
          wrapperRef={textAreaWrapperRef}
          onChange={handleTextChange}
          onBlur={() => handleToggleEdit()}
        />
      ) : (
        <AiResponseView
          content={aiResponse}
          isLocked={isMarkdownLocked}
          onToggleEdit={handleToggleEdit}
        />
      )}
    </div>
  );
};

export default AiAnswer;
