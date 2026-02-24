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
} from "../../../types/chat.types";
import { stripToolBlocks } from "../../../utils/stripToolBlocks";
import { groupMessagesByDate, associateToolResults } from "../../../utils/messageTransforms";
import { useChatActions } from "../context/ChatActionContext";
import "./ChatMessageList.scss";

interface ChatMessageListProps {
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  pendingUserMessage?: string;
  editingMessageId?: string | null;
  streamError?: string | null;
  onDismissError?: () => void;
  questionnaire?: QuestionnaireData | null;
  toolCalls?: any[];
  userAvatarUrl?: string | null;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  allMessages,
  streamingContent = "",
  isStreaming = false,
  pendingUserMessage,
  editingMessageId,
  streamError,
  onDismissError,
  questionnaire,
  toolCalls,
  userAvatarUrl,
}) => {
  const { onQuestionnaireSelect } = useChatActions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAtBottom = useRef(true);

  const displayStreamContent = useMemo(
    () => stripToolBlocks(streamingContent),
    [streamingContent],
  );

  const messages = useMemo(() => {
    const enriched = associateToolResults(allMessages);
    return enriched.filter(
      (m) =>
        m.role !== "TOOL" &&
        (m.role !== "SYSTEM" || !m.content?.startsWith("[Conversation summary")),
    );
  }, [allMessages]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.content?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const [activeSearchIdx, setActiveSearchIdx] = useState(0);

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

  const handleScroll = useCallback(() => {
    if (!innerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = innerRef.current;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottom.current && !searchOpen) {
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

  const questionnaireTargetId = useMemo(() => {
    if (!canShowQuestionnaire) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "ASSISTANT" && Array.isArray(m.toolCalls) && m.toolCalls.length > 0) {
        if (m.toolCalls.some((tc: any) => tc.name?.toLowerCase().includes("questionnaire"))) {
          return m.id;
        }
      }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ASSISTANT") return messages[i].id;
    }
    return null;
  }, [messages, canShowQuestionnaire, onQuestionnaireSelect]);

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  return (
    <div className="chat-message-list">
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
              if (e.key === "Enter" && searchResults.length > 0) {
                scrollToMessage(searchResults[activeSearchIdx]);
                handleSearchNav(1);
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
        >
          <Search size={16} />
        </button>
      )}

      <div className="chat-message-list__inner" ref={innerRef}>
        {messageGroups.map((group) => (
          <React.Fragment key={group.dateLabel}>
            <div className="chat-message-list__date-sep">
              <span>{group.dateLabel}</span>
            </div>
            {group.messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                toolResultsFromNextMessage={(msg as any).associatedToolResults}
                isStreaming={false}
                editingMessageId={editingMessageId}
                questionnaire={msg.id === questionnaireTargetId ? questionnaire : undefined}
                userAvatarUrl={userAvatarUrl}
              />
            ))}
          </React.Fragment>
        ))}

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
            userAvatarUrl={userAvatarUrl}
          />
        )}
        {isStreaming && (
          <>
            {streamingContent || (toolCalls && toolCalls.length > 0) ? (
              <ChatMessageItem
                key="streaming"
                message={{
                  id: "streaming",
                  sessionId: "",
                  role: "ASSISTANT",
                  content: streamingContent,
                  toolCalls: toolCalls,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
                streamingContent={displayStreamContent || streamingContent}
                toolCalls={toolCalls}
                userAvatarUrl={userAvatarUrl}
              />
            ) : (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__avatar">
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
