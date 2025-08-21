import React from "react";
import "./AiAnswer.scss";
import { AiAnswerHeader } from "./AiAnswerHeader";
import { GenerateButton } from "./GenerateButton";
import { AiResponseView } from "./AiResponseView";
import { AiResponseEdit } from "./AiResponseEdit";
import { useAiAnswer } from "../../../../../hooks/useAiAnswer";
import { Modal } from "antd";
import AiPromptTextArea from "./AiPromptTextArea";
import { RefreshCcw } from "lucide-react";

export const AiAnswer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const {
    setModel,
    aiResponse,
    isMarkdownLocked,
    isEditing,
    isLoading,
    isError,
    contextHolder,
    textAreaWrapperRef,
    handleGenerate,
    setAiPrompt,
    aiPrompt,
    handleToggleEdit,
    handleTextChange,
    buttonConfig,
  } = useAiAnswer();

  return (
    <div className="generate-post-result ai-answer__wrapper">
      {contextHolder}
      <AiAnswerHeader
        title="Придумайте текст к посту"
        subtitle="Нажмите на текст для редактирования"
      >
        <GenerateButton
          {...buttonConfig}
          onClick={() => setIsModalOpen(true)}
        />
        <GenerateButton
          onClick={handleGenerate}
          icon={<RefreshCcw size={20} />}
          loading={isLoading}
          style={{
            backgroundColor: isError ? "red" : "var(--button-primary-bg)",
          }}
        />
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
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <AiPromptTextArea
          setAiPrompt={setAiPrompt}
          aiPrompt={aiPrompt}
          modalToggler={setIsModalOpen}
          generatePost={handleGenerate}
          setModel={setModel}
        />
      </Modal>
    </div>
  );
};

export default AiAnswer;
