import React from "react";
import "./AiAnswer.scss";
import { AiAnswerHeader } from "./AiAnswerHeader";
import { GenerateButton } from "./GenerateButton";
import { useAiAnswer } from "../../../../../hooks/useAiAnswer";
import { Modal } from "antd";
import AiPromptTextArea from "./AiPromptTextArea";
import { RefreshCcw } from "lucide-react";
import MarkdownEditor from "../../../../../components/MarkdownEditor/MarkdownEditor";
import { useAppDispatch } from "../../../../../store/hooks";
import { setPostEntities } from "../../../../../features/aiResponceSlice";

export const AiAnswer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const {
    setModel,
    aiResponse,
    isLoading,
    isError,
    contextHolder,
    handleGenerate,
    setAiPrompt,
    aiPrompt,
    handleTextChange,
    buttonConfig,
  } = useAiAnswer();

  const dispatch = useAppDispatch();

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
            backgroundColor: isError
              ? "var(--color-red)"
              : "var(--button-primary-bg)",
          }}
        />
      </AiAnswerHeader>

      <MarkdownEditor
        value={aiResponse}
        onChange={handleTextChange}
        onEntitiesChange={(entities) => dispatch(setPostEntities(entities))}
      />
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
