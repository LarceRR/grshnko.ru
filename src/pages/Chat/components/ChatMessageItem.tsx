import React, { useMemo } from "react";
import Markdown from "react-markdown";
import { motion } from "framer-motion";
import { ToolCallBlock } from "./tools/ToolCallBlock";
import { QuestionnaireCards } from "./tools/QuestionnaireCards";
import { MessageActions } from "./branching/MessageActions";
import { EditMessageInline } from "./branching/EditMessageInline";
import type {
  ChatMessage,
  QuestionnaireData,
  QuestionnaireOption,
} from "../../../types/chat.types";
import { stripToolBlocks } from "../../../utils/stripToolBlocks";
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
  /** Tool results from the next message (TOOL role) when displaying an assistant message with tool calls */
  toolResultsFromNextMessage?: unknown;
  isStreaming?: boolean;
  streamingContent?: string;
  editingMessageId?: string | null;
  onEdit?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onNavigateBranch?: (messageId: string, branchIndex: number) => void;
  onSubmitEdit?: (messageId: string, content: string) => void;
  onCancelEdit?: () => void;
  /** Questionnaire data to render inline (inside the tool call block) */
  questionnaire?: QuestionnaireData | null;
  onQuestionnaireSelect?: (option: QuestionnaireOption) => void;
  onQuestionnaireSubmit?: (text: string) => void;
  onQuestionnaireSkip?: () => void;
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
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls as ToolCallEntry[];
}

function parseToolResults(toolResults: unknown): ToolResultEntry[] {
  if (!Array.isArray(toolResults)) return [];
  return toolResults as ToolResultEntry[];
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isStreaming,
  streamingContent,
  editingMessageId,
  onEdit,
  onRegenerate,
  onCopy,
  onNavigateBranch,
  onSubmitEdit,
  onCancelEdit,
  questionnaire,
  onQuestionnaireSelect,
  onQuestionnaireSubmit,
  onQuestionnaireSkip,
  toolResultsFromNextMessage,
}) => {
  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";
  const isAssistant = message.role === "ASSISTANT";
  const isEditing = editingMessageId === message.id;
  const rawContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : (message.content ?? "");
  const content = stripToolBlocks(rawContent);

  const toolCalls = parseToolCalls(message.toolCalls);
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

  // Hide TOOL role messages (internal messages, not for display)
  if (message.role === "TOOL") {
    return null;
  }

  // Hide empty assistant messages (e.g. tool-call-only with no content, or whitespace-only)
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
        <div className="chat-message__avatar" title="Ассистент">
          <span className="chat-message__avatar-inner">AI</span>
        </div>
      )}
      <div className="chat-message__bubble">
        {isEditing && onCancelEdit && onSubmitEdit ? (
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
              (() => {
                return toolCalls.map((tc, i) => {
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
                  const status = res
                    ? res.isError
                      ? "error"
                      : "done"
                    : "running";
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
                });
              })()}
            {/* Fallback: render questionnaire directly if no tool call block claimed it */}
            {questionnaire &&
              (questionnaire.options?.length > 0 ||
                questionnaire.groups?.length) &&
              (onQuestionnaireSelect || onQuestionnaireSubmit) &&
              !toolCalls.some((tc) =>
                (tc.name ?? "").toLowerCase().includes("questionnaire"),
              ) && (
                <QuestionnaireCards
                  question={questionnaire.question}
                  options={questionnaire.options}
                  groups={questionnaire.groups}
                  onSelect={onQuestionnaireSelect ?? (() => {})}
                  onSubmit={onQuestionnaireSubmit}
                  onSkip={onQuestionnaireSkip}
                  disabled={false}
                />
              )}
            {!isStreaming && timeStr && (
              <span className="chat-message__time">{timeStr}</span>
            )}
            {onEdit != null &&
              onRegenerate != null &&
              onCopy != null &&
              onNavigateBranch != null && (
                <MessageActions
                  message={message}
                  branchInfo={message.branchInfo ?? null}
                  onEdit={onEdit}
                  onRegenerate={onRegenerate}
                  onCopy={onCopy}
                  onNavigateBranch={onNavigateBranch}
                  isStreaming={isStreaming}
                />
              )}
          </>
        )}
      </div>
    </div>
  );
};
