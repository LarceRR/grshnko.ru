import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Input } from "antd";
import { Search, X } from "lucide-react";
import { ChatMessageItem } from "./ChatMessageItem";
import type {
  ChatMessage,
  QuestionnaireData,
  QuestionnaireOption,
} from "../../../types/chat.types";
import { stripToolBlocks } from "../../../utils/stripToolBlocks";
import "./ChatMessageList.scss";

/** Format a date as a Telegram-style separator label */
function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (today.getTime() - msgDay.getTime()) / 86_400_000,
    );

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: now.getFullYear() !== d.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function getDateKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return "";
  }
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  /** Full list including TOOL messages; used to resolve tool results for assistant messages */
  allMessages?: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  /** Shown immediately when user sends (before server confirms) */
  pendingUserMessage?: string;
  editingMessageId?: string | null;
  onEdit?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onNavigateBranch?: (messageId: string, branchIndex: number) => void;
  onSubmitEdit?: (messageId: string, content: string) => void;
  onCancelEdit?: () => void;
  /** Stream error to display as an inline banner */
  streamError?: string | null;
  onDismissError?: () => void;
  /** Questionnaire to render inline (inside the chat flow) */
  questionnaire?: QuestionnaireData | null;
  onQuestionnaireSelect?: (option: QuestionnaireOption) => void;
  onQuestionnaireSubmit?: (text: string) => void;
  onQuestionnaireSkip?: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  allMessages,
  streamingContent = "",
  isStreaming = false,
  pendingUserMessage,
  editingMessageId,
  onEdit,
  onRegenerate,
  onCopy,
  onNavigateBranch,
  onSubmitEdit,
  onCancelEdit,
  streamError,
  onDismissError,
  questionnaire,
  onQuestionnaireSelect,
  onQuestionnaireSubmit,
  onQuestionnaireSkip,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayStreamContent = useMemo(
    () => stripToolBlocks(streamingContent),
    [streamingContent],
  );

  // Search: find matching message IDs
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.content?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const [activeSearchIdx, setActiveSearchIdx] = useState(0);

  // Scroll to search result
  const scrollToMessage = useCallback((messageId: string) => {
    const el = innerRef.current?.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("chat-message--highlight");
      setTimeout(() => el.classList.remove("chat-message--highlight"), 2000);
    }
  }, []);

  // Navigate search results
  const handleSearchNav = useCallback(
    (direction: 1 | -1) => {
      if (searchResults.length === 0) return;
      const next =
        (activeSearchIdx + direction + searchResults.length) %
        searchResults.length;
      setActiveSearchIdx(next);
      scrollToMessage(searchResults[next]);
    },
    [searchResults, activeSearchIdx, scrollToMessage],
  );

  // Auto-scroll to bottom on new messages / streaming
  useEffect(() => {
    if (!searchOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    messages.length,
    streamingContent,
    pendingUserMessage,
    questionnaire,
    searchOpen,
  ]);

  const canShowQuestionnaire =
    !isStreaming &&
    !!(questionnaire?.options?.length || questionnaire?.groups?.length) &&
    !!onQuestionnaireSelect;

  // Find the last assistant message that has a questionnaire tool call — that's where we render the cards
  const questionnaireTargetId = useMemo(() => {
    if (!canShowQuestionnaire) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        m.role === "ASSISTANT" &&
        Array.isArray(m.toolCalls) &&
        m.toolCalls.length > 0
      ) {
        const hasQTool = m.toolCalls.some(
          (tc: Record<string, unknown>) =>
            typeof tc.name === "string" &&
            tc.name.toLowerCase().includes("questionnaire"),
        );
        if (hasQTool) return m.id;
      }
    }
    // Fallback: attach to the very last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ASSISTANT") return messages[i].id;
    }
    return null;
  }, [messages, canShowQuestionnaire]);

  // Build date-grouped message elements
  const messageElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let lastDateKey = "";

    const fullList = allMessages ?? messages;
    for (const msg of messages) {
      const dateKey = getDateKey(msg.createdAt);
      if (dateKey && dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        elements.push(
          <div key={`date-${dateKey}`} className="chat-message-list__date-sep">
            <span>{formatDateLabel(msg.createdAt)}</span>
          </div>,
        );
      }
      const nextInFull =
        fullList[fullList.findIndex((m) => m.id === msg.id) + 1];
      const toolResultsFromNext =
        nextInFull?.role === "TOOL" && Array.isArray(nextInFull.toolResults)
          ? nextInFull.toolResults
          : undefined;
      const attachQuestionnaire =
        canShowQuestionnaire && msg.id === questionnaireTargetId;
      elements.push(
        <ChatMessageItem
          key={msg.id}
          message={msg}
          toolResultsFromNextMessage={toolResultsFromNext}
          isStreaming={false}
          editingMessageId={editingMessageId}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
          onNavigateBranch={onNavigateBranch}
          onSubmitEdit={onSubmitEdit}
          onCancelEdit={onCancelEdit}
          questionnaire={attachQuestionnaire ? questionnaire : undefined}
          onQuestionnaireSelect={
            attachQuestionnaire ? onQuestionnaireSelect : undefined
          }
          onQuestionnaireSubmit={
            attachQuestionnaire ? onQuestionnaireSubmit : undefined
          }
          onQuestionnaireSkip={
            attachQuestionnaire ? onQuestionnaireSkip : undefined
          }
        />,
      );
    }
    return elements;
  }, [
    messages,
    allMessages,
    editingMessageId,
    onEdit,
    onRegenerate,
    onCopy,
    onNavigateBranch,
    onSubmitEdit,
    onCancelEdit,
    canShowQuestionnaire,
    questionnaireTargetId,
    questionnaire,
    onQuestionnaireSelect,
    onQuestionnaireSubmit,
    onQuestionnaireSkip,
  ]);

  return (
    <div className="chat-message-list">
      {/* Search bar */}
      {searchOpen && (
        <div className="chat-message-list__search">
          <Search size={16} className="chat-message-list__search-icon" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveSearchIdx(0);
            }}
            placeholder="Поиск по сообщениям…"
            size="small"
            className="chat-message-list__search-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (searchResults.length > 0) {
                  scrollToMessage(searchResults[activeSearchIdx]);
                  handleSearchNav(1);
                }
              }
              if (e.key === "Escape") {
                setSearchOpen(false);
                setSearchQuery("");
              }
            }}
          />
          {searchQuery && searchResults.length > 0 && (
            <span className="chat-message-list__search-count">
              {activeSearchIdx + 1}/{searchResults.length}
            </span>
          )}
          <button
            type="button"
            className="chat-message-list__search-close"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!searchOpen && messages.length > 0 && (
        <button
          type="button"
          className="chat-message-list__search-toggle"
          onClick={() => setSearchOpen(true)}
          title="Поиск по сообщениям"
        >
          <Search size={16} />
        </button>
      )}

      <div className="chat-message-list__inner" ref={innerRef}>
        {messageElements}
        {pendingUserMessage && (
          <ChatMessageItem
            message={{
              id: "pending-user",
              sessionId: "",
              role: "USER",
              content: pendingUserMessage,
              createdAt: new Date().toISOString(),
            }}
            isStreaming={false}
          />
        )}
        {isStreaming && (
          <>
            {streamingContent ? (
              <ChatMessageItem
                message={{
                  id: "streaming",
                  sessionId: "",
                  role: "ASSISTANT",
                  content: displayStreamContent || streamingContent,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
                streamingContent={displayStreamContent || streamingContent}
              />
            ) : (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__avatar" title="Ассистент">
                  <span className="chat-message__avatar-inner">AI</span>
                </div>
                <div className="chat-message__bubble">
                  <div className="chat-message-list__thinking">
                    <span className="chat-message-list__thinking-dot" />
                    <span className="chat-message-list__thinking-dot" />
                    <span className="chat-message-list__thinking-dot" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {streamError && (
          <div className="chat-message-list__error">
            <span className="chat-message-list__error-text">{streamError}</span>
            {onDismissError && (
              <button
                type="button"
                className="chat-message-list__error-close"
                onClick={onDismissError}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      <div ref={bottomRef} className="chat-message-list__anchor" />
    </div>
  );
};
