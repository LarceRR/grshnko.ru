import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import { motion } from "framer-motion";
import { Clock, CheckCheck } from "lucide-react";
import { ToolCallBlock } from "./tools/ToolCallBlock";
import { QuestionnaireCards } from "./tools/QuestionnaireCards";
import { MessageActions } from "./branching/MessageActions";
import { EditMessageInline } from "./branching/EditMessageInline";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";
import type { ChatMessage, QuestionnaireData } from "../../../types/chat.types";
import type { MessageStatus } from "./ChatMessageList";
import {
  stripToolBlocks,
  extractToolCallsFromContent,
} from "../../../utils/stripToolBlocks";
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
  toolResultsFromNextMessage?: unknown;
  isStreaming?: boolean;
  streamingContent?: string;
  editingMessageId?: string | null;
  questionnaire?: QuestionnaireData | null;
  toolCalls?: any[];
  userAvatarUrl?: string | null;
  peerAvatarUrl?: string | null;
  showAvatar?: boolean;
  isDirect?: boolean;
  currentUserId?: string | null;
  messageStatus?: MessageStatus;
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
  peerAvatarUrl = null,
  showAvatar = true,
  isDirect = false,
  currentUserId,
  messageStatus,
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

  // In DIRECT sessions, agentId stores the sender's userId
  const isMine = isDirect
    ? message.agentId === currentUserId
    : message.role === "USER";
  const isUser = isDirect ? isMine : message.role === "USER";
  const isSystem = message.role === "SYSTEM";
  const isAssistant = isDirect
    ? !isMine && message.role === "USER"
    : message.role === "ASSISTANT";
  const isEditing = editingMessageId === message.id;
  const rawContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : (message.content ?? "");
  const content = stripToolBlocks(rawContent);

  const toolCalls =
    toolCallsProp ??
    (parseToolCalls(message.toolCalls) ||
      (rawContent ? extractToolCallsFromContent(rawContent) : []));
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

  const isPending = (message as any)._isPending === true;
  const isGrouped = !showAvatar;

  return (
    <div
      className={`chat-message chat-message--${isUser ? "user" : "assistant"}${isGrouped ? " chat-message--grouped" : ""}`}
      data-message-id={message.id}
      data-sequence-number={message.sequenceNumber}
    >
      {isAssistant && (
        <div
          className="chat-message__avatar"
          title={isDirect ? "Профиль" : "Редактировать агента"}
          onClick={() =>
            showAvatar &&
            (isDirect
              ? message.agentId && navigate(`/profile/${message.agentId}`)
              : message.agentId &&
                navigate(`/system/agents/${message.agentId}`))
          }
          style={{ cursor: showAvatar ? "pointer" : undefined }}
        >
          {showAvatar ? (
            isDirect && peerAvatarUrl ? (
              <UserAvatar
                avatarUrl={peerAvatarUrl}
                size={30}
                className="chat-message__avatar-inner"
                style={{ display: "block" }}
              />
            ) : (
              <span className="chat-message__avatar-inner">
                {isDirect ? "DM" : "AI"}
              </span>
            )
          ) : (
            <span className="chat-message__avatar-spacer" aria-hidden />
          )}
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
                const status =
                  (tc as any).status ||
                  (res ? (res.isError ? "error" : "done") : "running");
                const toolName =
                  (tc as { name?: string; toolName?: string }).toolName ??
                  (tc as { name?: string }).name ??
                  "tool";
                const isQuestionnaireTool = (toolName ?? "")
                  .toLowerCase()
                  .includes("questionnaire");
                return (
                  <ToolCallBlock
                    key={callId ?? i}
                    toolName={toolName}
                    arguments={args}
                    result={res?.result}
                    status={status}
                    displayType={
                      res?.displayType ?? (res?.result as any)?.displayType
                    }
                    displayData={
                      res?.displayData ?? (res?.result as any)?.displayData
                    }
                    questionnaire={
                      isQuestionnaireTool ? questionnaire : undefined
                    }
                    onQuestionnaireSelect={
                      isQuestionnaireTool && (callId ?? tc.id)
                        ? (option: any) =>
                            onQuestionnaireSelect(option, {
                              callId: String(callId ?? tc.id),
                              assistantMessageId: message.id,
                            })
                        : undefined
                    }
                    onQuestionnaireSubmit={
                      isQuestionnaireTool && (callId ?? tc.id)
                        ? (text: string) =>
                            onQuestionnaireSubmit(text, {
                              callId: String(callId ?? tc.id),
                              assistantMessageId: message.id,
                            })
                        : undefined
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
              !toolCalls.some((tc) => {
                const n =
                  (tc as { name?: string; toolName?: string }).toolName ??
                  (tc as { name?: string }).name ??
                  "";
                return n.toLowerCase().includes("questionnaire");
              }) && (
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
              <span className="chat-message__time">
                {timeStr}
                {messageStatus && (
                  <span
                    className={`chat-message__status chat-message__status--${messageStatus}`}
                  >
                    {messageStatus === "pending" ? (
                      <Clock size={13} />
                    ) : (
                      <CheckCheck size={13} />
                    )}
                  </span>
                )}
              </span>
            )}
          </>
        )}
        {!isStreaming && !isEditing && !isPending && (
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
      {isUser &&
        (showAvatar ? (
          <UserAvatar
            avatarUrl={userAvatarUrl}
            size={30}
            className="chat-message__avatar"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/profile")}
          />
        ) : (
          <span
            className="chat-message__avatar chat-message__avatar-spacer"
            aria-hidden
          />
        ))}
    </div>
  );
};
