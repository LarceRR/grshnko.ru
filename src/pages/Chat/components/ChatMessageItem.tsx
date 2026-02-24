import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import { motion } from "framer-motion";
import { ToolCallBlock } from "./tools/ToolCallBlock";
import { QuestionnaireCards } from "./tools/QuestionnaireCards";
import { MessageActions } from "./branching/MessageActions";
import { EditMessageInline } from "./branching/EditMessageInline";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";
import type {
  ChatMessage,
  QuestionnaireData,
} from "../../../types/chat.types";
import { stripToolBlocks } from "../../../utils/stripToolBlocks";
import { useChatActions } from "../context/ChatActionContext";
import "./ChatMessageItem.scss";

function formatTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface ChatMessageItemProps {
  message: ChatMessage;
  /** Tool results associated with this message */
  toolResultsFromNextMessage?: unknown;
  isStreaming?: boolean;
  streamingContent?: string;
  editingMessageId?: string | null;
  /** Questionnaire data to render inline (inside the tool call block) */
  questionnaire?: QuestionnaireData | null;
  /** Explicit tool calls (useful for streaming) */
  toolCalls?: any[];
  /** Current user's avatar URL */
  userAvatarUrl?: string | null;
}

interface ToolCallEntry {
  name?: string;
  arguments?: string | Record<string, unknown>;
  callId?: string;
  id?: string;
}

interface ToolResultEntry {
  callId?: string;
  result?: unknown;
  isError?: boolean;
  displayType?: string;
  displayData?: unknown;
}

function parseToolCalls(toolCalls: unknown): ToolCallEntry[] {
  if (typeof toolCalls === "string") {
    try {
      return JSON.parse(toolCalls);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls as ToolCallEntry[];
}

function parseToolResults(toolResults: unknown): ToolResultEntry[] {
  if (typeof toolResults === "string") {
    try {
      return JSON.parse(toolResults);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(toolResults)) return [];
  return toolResults as ToolResultEntry[];
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isStreaming,
  streamingContent,
  editingMessageId,
  questionnaire,
  toolResultsFromNextMessage,
  toolCalls: toolCallsProp,
  userAvatarUrl,
}) => {
  const {
    onEdit,
    regenerateMessage,
    onCopy,
    onNavigateBranch,
    onSubmitEdit,
    onCancelEdit,
    onQuestionnaireSelect,
    onQuestionnaireSubmit,
    onQuestionnaireSkip,
  } = useChatActions();
  const navigate = useNavigate();

  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";
  const isAssistant = message.role === "ASSISTANT";
  const isEditing = editingMessageId === message.id;
  const rawContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : (message.content ?? "");
  const content = stripToolBlocks(rawContent);

  const toolCalls = toolCallsProp || parseToolCalls(message.toolCalls);
  const toolResults = parseToolResults(
    Array.isArray(toolResultsFromNextMessage)
      ? toolResultsFromNextMessage
      : message.toolResults,
  );

  if (isSystem) {
    return (
      <div className="chat-message chat-message--system">
        <span className="chat-message__system-text">{message.content}</span>
      </div>
    );
  }

  if (message.role === "TOOL") return null;

  if (
    isAssistant &&
    !isStreaming &&
    !content?.trim() &&
    toolCalls.length === 0
  ) {
    return null;
  }

  const getResult = (callId: string | undefined) => {
    if (!callId) return undefined;
    return toolResults.find(
      (r) => r.callId === callId || (r as { id?: string }).id === callId,
    );
  };

  const timeStr = useMemo(
    () => formatTime(message.createdAt),
    [message.createdAt],
  );

  return (
    <div
      className={`chat-message chat-message--${isUser ? "user" : "assistant"}`}
      data-message-id={message.id}
    >
      {isAssistant && (
        <div 
          className="chat-message__avatar" 
          title="Редактировать агента"
          onClick={() => message.agentId && navigate(`/system/agents/${message.agentId}`)}
          style={{ cursor: 'pointer' }}
        >
          <span className="chat-message__avatar-inner">AI</span>
        </div>
      )}
      <div className="chat-message__bubble">
        {isEditing ? (
          <EditMessageInline
            messageId={message.id}
            initialContent={message.content ?? ""}
            onSubmit={(c) => onSubmitEdit(message.id, c)}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            {content ? (
              <div className="chat-message__content">
                <Markdown>{content}</Markdown>
                {isStreaming && (
                  <motion.span
                    className="chat-message__cursor"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    |
                  </motion.span>
                )}
              </div>
            ) : null}
            {!isEditing &&
              toolCalls.length > 0 &&
              toolCalls.map((tc, i) => {
                const callId = tc.callId ?? tc.id;
                const res = getResult(callId);
                const args =
                  typeof tc.arguments === "string"
                    ? (() => {
                        try {
                          return JSON.parse(tc.arguments) as Record<
                            string,
                            unknown
                          >;
                        } catch {
                          return {};
                        }
                      })()
                    : ((tc.arguments as Record<string, unknown>) ?? {});
                const status = (tc as any).status || (res
                  ? res.isError
                    ? "error"
                    : "done"
                  : "running");
                const isQuestionnaireTool = (tc.name ?? "")
                  .toLowerCase()
                  .includes("questionnaire");
                return (
                  <ToolCallBlock
                    key={callId ?? i}
                    toolName={tc.name ?? "tool"}
                    arguments={args}
                    result={res?.result}
                    status={status}
                    displayType={res?.displayType}
                    displayData={res?.displayData}
                    questionnaire={
                      isQuestionnaireTool ? questionnaire : undefined
                    }
                    onQuestionnaireSelect={
                      isQuestionnaireTool ? onQuestionnaireSelect : undefined
                    }
                    onQuestionnaireSubmit={
                      isQuestionnaireTool ? onQuestionnaireSubmit : undefined
                    }
                    onQuestionnaireSkip={
                      isQuestionnaireTool ? onQuestionnaireSkip : undefined
                    }
                  />
                );
              })}
            {questionnaire &&
              (questionnaire.options?.length > 0 ||
                questionnaire.groups?.length) &&
              !toolCalls.some((tc) =>
                (tc.name ?? "").toLowerCase().includes("questionnaire"),
              ) && (
                <QuestionnaireCards
                  question={questionnaire.question}
                  options={questionnaire.options}
                  groups={questionnaire.groups}
                  onSelect={onQuestionnaireSelect}
                  onSubmit={onQuestionnaireSubmit}
                  onSkip={onQuestionnaireSkip}
                  disabled={false}
                />
              )}
            {!isStreaming && timeStr && (
              <span className="chat-message__time">{timeStr}</span>
            )}
          </>
        )}
        {!isStreaming && !isEditing && (
          <MessageActions
            message={message}
            branchInfo={message.branchInfo ?? null}
            onEdit={onEdit}
            onRegenerate={regenerateMessage}
            onCopy={onCopy}
            onNavigateBranch={onNavigateBranch}
            isStreaming={isStreaming}
          />
        )}
      </div>
      {isUser && (
        <UserAvatar
          avatarUrl={userAvatarUrl}
          size={30}
          className="chat-message__avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate("/profile")}
        />
      )}
    </div>
  );
};
