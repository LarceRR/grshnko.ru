import React, { useState, useCallback } from "react";
import { Input, Button } from "antd";
import { Send, Square } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLLMModels } from "../../../api/llmModels";
import { ModelSelect } from "../../../components/ModelSelect/ModelSelect";
import "./ChatInputBar.scss";

const { TextArea } = Input;

interface ChatInputBarProps {
  onSend: (content: string, modelOverride?: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onStop,
  disabled,
  isStreaming,
}) => {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const { data: modelsData = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["llm-models"],
    queryFn: getLLMModels,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  const handleSubmit = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text, selectedModel || undefined);
    setValue("");
  }, [value, disabled, onSend, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-bar">
      <div className="chat-input-bar__top">
        <ModelSelect
          models={modelsData}
          value={selectedModel}
          onChange={(v) => setSelectedModel(v ?? "")}
          allowAuto
          placeholder="Авто"
          size="small"
          className="chat-input-bar__model-select"
          loading={modelsLoading}
          disabled={disabled || isStreaming}
        />
      </div>
      <div className="chat-input-bar__row">
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение… (Enter — отправить, Shift+Enter — новая строка)"
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={disabled}
          className="chat-input-bar__input"
        />
        {isStreaming && onStop ? (
          <Button
            type="primary"
            danger
            icon={<Square size={16} />}
            onClick={onStop}
            className="chat-input-bar__btn"
            title="Стоп"
          />
        ) : (
          <Button
            type="primary"
            icon={<Send size={16} />}
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="chat-input-bar__btn"
            title="Отправить"
          />
        )}
      </div>
    </div>
  );
};
