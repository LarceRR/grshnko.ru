import React, { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLLMModels } from "../../../api/llmModels";
import { ModelSelect } from "../../../components/ModelSelect/ModelSelect";
import { AgentSelector } from "./AgentSelector";
import "./ChatInputBar.scss";

interface ChatInputBarProps {
  onSend: (content: string, modelOverride?: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  sessionId?: string | null;
  agents?: any[];
  currentAgentId?: string | null;
  onAgentChange?: (agentId: string) => void;
  currentUserId?: string | null;
  isDirect?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onStop,
  disabled,
  isStreaming,
  sessionId,
  agents,
  currentAgentId,
  onAgentChange,
  currentUserId,
  isDirect,
}) => {
  const [content, setContent] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: modelsData = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["llm-models"],
    queryFn: getLLMModels,
    staleTime: 10 * 60 * 1000,
  });

  const handleSend = () => {
    if (!content.trim() || disabled || isStreaming) return;
    onSend(content.trim(), selectedModel || undefined);
    setContent("");
    // Reset model selection after sending (optional - keep if user wants to use same model)
    // setSelectedModel("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
    }
  }, [content]);

  return (
    <div className="chat-input-bar">
      <div className="chat-input-bar__field-wrapper">
        {!isDirect && (
          <div className="chat-input-bar__field-wrapper-inner">
            <div className="chat-input-bar__agent">
              <AgentSelector
                agents={agents || []}
                value={currentAgentId || null}
                onChange={onAgentChange || (() => {})}
                disabled={!sessionId || isStreaming}
                currentUserId={currentUserId}
              />
            </div>
            <div className="chat-input-bar__model">
              <ModelSelect
                models={modelsData}
                value={selectedModel}
                onChange={(v) => setSelectedModel(v ?? "")}
                allowAuto
                placeholder="Авто"
                size="small"
                loading={modelsLoading}
                disabled={disabled || isStreaming}
              />
            </div>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="chat-input-bar__input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
          disabled={disabled}
        />
      </div>

      {isStreaming ? (
        <button
          type="button"
          className="chat-input-bar__send-btn chat-input-bar__send-btn--stop"
          onClick={onStop}
          title="Остановить"
        >
          <Square size={18} fill="currentColor" />
        </button>
      ) : (
        <button
          type="button"
          className="chat-input-bar__send-btn"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          title="Отправить"
        >
          <Send size={18} />
        </button>
      )}
    </div>
  );
};
