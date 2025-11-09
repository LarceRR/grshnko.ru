import React from "react";
import "./AiAnswer.scss";
import { AiAnswerHeader } from "./AiAnswerHeader";
import { GenerateButton } from "./GenerateButton";
import { useAiAnswer } from "../../../../../hooks/useAiAnswer";
import { Modal } from "antd";
import AiPromptTextArea from "./AiPromptTextArea";
import { RefreshCcw } from "lucide-react";
import MarkdownEditor from "../../../../../components/MarkdownEditor/MarkdownEditor";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { setPostEntities } from "../../../../../features/aiResponceSlice";

export const AiAnswer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const {
    setModel,
    model,
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
  const selectedVideos = useAppSelector(
    (state) => state.currentVideo.selectedVideos
  );
  const activeChannel = useAppSelector(
    (state) => state.selectedChannel.channel
  );

  const primaryVideo = selectedVideos?.[0];
  const videoSourceUrl = primaryVideo?.url || primaryVideo?.fullUrl;
  const channelUsername =
    activeChannel?.entity?.username || activeChannel?.username;
  const channelUrl = channelUsername
    ? `https://t.me/${channelUsername.replace(/^@/, "")}`
    : undefined;

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
        aiResponse={aiResponse}
        isAiGenerating={isLoading}
        onChange={handleTextChange}
        onEntitiesChange={(entities) => dispatch(setPostEntities(entities))}
        videoSourceUrl={videoSourceUrl}
        channelUrl={channelUrl}
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
          selectedModel={model}
        />
      </Modal>
    </div>
  );
};

export default AiAnswer;
