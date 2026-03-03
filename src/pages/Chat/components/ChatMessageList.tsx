import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Input } from "antd";
import { Search, X, Loader2 } from "lucide-react";
import { ChatMessageItem } from "./ChatMessageItem";
import type {
  ChatMessage,
  QuestionnaireData,
  QuestionnaireGroup,
  QuestionnaireOption,
} from "../../../types/chat.types";
import {
  stripToolBlocks,
  extractToolCallsFromContent,
} from "../../../utils/stripToolBlocks";
import {
  groupMessagesByDate,
  associateToolResults,
} from "../../../utils/messageTransforms";
import { useReadState } from "../../../hooks/useReadState";
import { useChatActions } from "../context/ChatActionContext";
import "./ChatMessageList.scss";

export type MessageStatus = "pending" | "sent" | "read";

interface ChatMessageListProps {
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  pendingMessage?: { clientId: string; content: string; createdAtMs: number };
  editingMessageId?: string | null;
  streamError?: string | null;
  onDismissError?: () => void;
  questionnaire?: QuestionnaireData | null;
  toolCalls?: any[];
  userAvatarUrl?: string | null;
  peerAvatarUrl?: string | null;
  sessionId?: string | null;
  lastReadSequenceNumber?: number;
  peerLastReadSequenceNumber?: number;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  isDirect?: boolean;
  currentUserId?: string | null;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  allMessages,
  streamingContent = "",
  isStreaming = false,
  pendingMessage,
  editingMessageId,
  streamError,
  onDismissError,
  questionnaire,
  toolCalls,
  userAvatarUrl,
  peerAvatarUrl = null,
  sessionId = null,
  lastReadSequenceNumber = 0,
  peerLastReadSequenceNumber,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  isDirect = false,
  currentUserId = null,
}) => {
  useChatActions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAtBottom = useRef(true);

  // --- Infinite scroll: load older pages ---
  const handleLoadMore = useCallback(() => {
    if (!onLoadMore || !innerRef.current) return;
    scrollSnapshotRef.current = {
      scrollHeight: innerRef.current.scrollHeight,
      scrollTop: innerRef.current.scrollTop,
    };
    onLoadMore();
  }, [onLoadMore]);

  // IntersectionObserver on the sentinel div to trigger fetchNextPage
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const sentinel = sentinelRef.current;
    const root = innerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { root, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, handleLoadMore]);

  // Scroll-position compensation after older messages are prepended
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!scrollSnapshotRef.current || !el) return;
    const { scrollHeight: oldHeight, scrollTop: oldTop } =
      scrollSnapshotRef.current;
    const newHeight = el.scrollHeight;
    if (newHeight > oldHeight) {
      el.style.scrollBehavior = "auto";
      el.scrollTop = oldTop + (newHeight - oldHeight);
      requestAnimationFrame(() => {
        el.style.scrollBehavior = "";
      });
    }
    scrollSnapshotRef.current = null;
  }, [allMessages]);

  const displayStreamContent = useMemo(
    () => stripToolBlocks(streamingContent),
    [streamingContent],
  );

  const serverMessages = useMemo(() => {
    const enriched = associateToolResults(allMessages);
    return enriched.filter(
      (m) =>
        m.role !== "TOOL" &&
        (m.role !== "SYSTEM" ||
          !m.content?.startsWith("[Conversation summary")),
    );
  }, [allMessages]);

  // Merge optimistic (pending) message into the array so it occupies the
  // same slot in the DOM. When the server-confirmed message arrives with a
  // matching clientId, React reconciles via the same key — no remount, no
  // re-animation.
  const messages = useMemo(() => {
    if (!pendingMessage) {
      return serverMessages;
    }

    let matched = false;
    const normalizedPendingContent = pendingMessage.content.trim();
    const matchedServerMessages = serverMessages.map((m) => {
      if ((m as any).clientId === pendingMessage.clientId) {
        matched = true;
        return m;
      }

      if (matched || m.role !== "USER") return m;

      const isMine = isDirect ? (m as any).agentId === currentUserId : true;
      if (!isMine) return m;

      const sameContent = (m.content ?? "").trim() === normalizedPendingContent;
      const closeInTime =
        Math.abs(
          new Date(m.createdAt).getTime() - pendingMessage.createdAtMs,
        ) <= 60_000;

      if (sameContent && closeInTime) {
        matched = true;
        return { ...m, clientId: pendingMessage.clientId };
      }
      return m;
    });

    if (matched) return matchedServerMessages;

    const pending: any = {
      id: pendingMessage.clientId,
      sessionId: sessionId || "",
      role: "USER" as const,
      content: pendingMessage.content,
      createdAt: new Date().toISOString(),
      clientId: pendingMessage.clientId,
      _isPending: true,
    };
    // In DIRECT sessions, agentId identifies the sender; set to current user so the message shows on the right
    if (isDirect && currentUserId) {
      pending.agentId = currentUserId;
    }
    return [...matchedServerMessages, pending];
  }, [serverMessages, pendingMessage, sessionId, isDirect, currentUserId]);

  const messageGroups = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
  );

  /** For each message id: show avatar only when it's the first in a run from the same sender or >1 min after previous from same sender */
  const showAvatarByMessageId = useMemo(() => {
    const map = new Map<string, boolean>();
    const getSenderKey = (m: ChatMessage) =>
      isDirect
        ? (m as any).agentId === currentUserId
          ? "me"
          : "peer"
        : m.role === "USER"
          ? "me"
          : "assistant";
    for (let i = 0; i < messages.length; i++) {
      const curr = messages[i];
      const currKey = getSenderKey(curr);
      const currTime = new Date(curr.createdAt).getTime();
      if (i === 0) {
        map.set(curr.id, true);
        continue;
      }
      const prev = messages[i - 1];
      const prevKey = getSenderKey(prev);
      const prevTime = new Date(prev.createdAt).getTime();
      const sameSender = prevKey === currKey;
      const withinMinute = currTime - prevTime <= 60_000;
      map.set(curr.id, !sameSender || !withinMinute);
    }
    return map;
  }, [messages, isDirect, currentUserId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.content?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const [activeSearchIdx, setActiveSearchIdx] = useState(0);
  const initialScrollDone = useRef(false);

  const { scrollToFirstUnread, markLatestAsRead } = useReadState({
    sessionId,
    messages,
    lastReadSequenceNumber,
    containerRef: innerRef,
    enabled: !searchOpen,
  });

  // AC-4: On session mount, scroll to first unread message
  useEffect(() => {
    if (initialScrollDone.current || messages.length === 0) return;
    initialScrollDone.current = true;
    if (lastReadSequenceNumber > 0) {
      requestAnimationFrame(() => scrollToFirstUnread());
    } else {
      scrollToBottom(false);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset initial scroll flag when session changes
  useEffect(() => {
    initialScrollDone.current = false;
  }, [sessionId]);

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
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottom.current = atBottom;

    // AC-6: When scrolled to bottom, mark the latest sequenceNumber as read
    if (atBottom && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sequenceNumber) {
        markLatestAsRead(lastMsg.sequenceNumber);
      }
    }
  }, [messages, markLatestAsRead]);

  useEffect(() => {
    const el = innerRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = innerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!isAtBottom.current || searchOpen) return;
    scrollToBottom(true);
  }, [messages.length, questionnaire, searchOpen, scrollToBottom]);

  // Streaming: scroll on every token without smooth to avoid jitter
  useEffect(() => {
    if (!isAtBottom.current || !streamingContent) return;
    scrollToBottom(false);
  }, [streamingContent, scrollToBottom]);

  // Pending message: force scroll immediately
  useEffect(() => {
    if (!pendingMessage) return;
    isAtBottom.current = true;
    scrollToBottom(false);
  }, [pendingMessage, scrollToBottom]);

  const getMessageToolCalls = useCallback((m: ChatMessage) => {
    const fromField =
      Array.isArray(m.toolCalls) && m.toolCalls.length > 0
        ? m.toolCalls
        : extractToolCallsFromContent(m.content ?? "");
    return fromField;
  }, []);

  /** Build QuestionnaireData from showQuestionnaire tool call arguments (for messages saved with tool in content). */
  const buildQuestionnaireFromMessage = useCallback(
    (m: ChatMessage): QuestionnaireData | null => {
      const tcs = getMessageToolCalls(m);
      const q = tcs.find((tc: any) =>
        tc.name?.toLowerCase().includes("questionnaire"),
      );
      if (!q?.arguments || typeof q.arguments !== "object") return null;
      const args = q.arguments as {
        title?: string;
        questions?: Array<{
          id?: string;
          label?: string;
          question?: string;
          type?: string;
          options?: string[];
        }>;
      };
      const questions = Array.isArray(args.questions) ? args.questions : [];
      const groups: QuestionnaireGroup[] = questions.map((item) => ({
        label: item.label,
        question: item.question,
        type: (item.type === "multiselect" ? "multiselect" : "select") as
          | "select"
          | "multiselect",
        options: (item.options || []).map(
          (o) =>
            ({ title: String(o), value: String(o) }) as QuestionnaireOption,
        ),
      }));
      if (groups.length === 0) return null;
      return { question: args.title, options: [], groups };
    },
    [getMessageToolCalls],
  );

  const questionnaireTargetId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "ASSISTANT") {
        const tcs = getMessageToolCalls(m);
        if (
          tcs.length > 0 &&
          tcs.some((tc: any) =>
            tc.name?.toLowerCase().includes("questionnaire"),
          )
        ) {
          return m.id;
        }
      }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ASSISTANT") return messages[i].id;
    }
    return null;
  }, [messages, getMessageToolCalls]);

  const getMessageStatus = useCallback(
    (msg: ChatMessage): MessageStatus | undefined => {
      const isMyMessage = isDirect
        ? (msg as any).agentId === currentUserId
        : msg.role === "USER";
      if (!isMyMessage) return undefined;

      if ((msg as any)._isPending) return "pending";

      if (
        isDirect &&
        peerLastReadSequenceNumber != null &&
        msg.sequenceNumber != null &&
        msg.sequenceNumber <= peerLastReadSequenceNumber
      ) {
        return "read";
      }

      return "sent";
    },
    [isDirect, currentUserId, peerLastReadSequenceNumber],
  );

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
        {hasMore && (
          <div ref={sentinelRef} className="chat-message-list__sentinel" />
        )}
        {isFetchingMore && (
          <div className="chat-message-list__top-spinner">
            <Loader2
              size={20}
              className="chat-message-list__top-spinner-icon"
            />
          </div>
        )}
        {messageGroups.map((group) => (
          <React.Fragment key={group.dateLabel}>
            <div className="chat-message-list__date-sep">
              <span>{group.dateLabel}</span>
            </div>
            {group.messages.map((msg) => (
              <ChatMessageItem
                key={(msg as any).clientId || msg.id}
                message={msg}
                toolResultsFromNextMessage={(msg as any).associatedToolResults}
                isStreaming={false}
                editingMessageId={editingMessageId}
                questionnaire={
                  msg.id === questionnaireTargetId
                    ? (questionnaire ?? buildQuestionnaireFromMessage(msg))
                    : undefined
                }
                userAvatarUrl={userAvatarUrl}
                peerAvatarUrl={peerAvatarUrl}
                showAvatar={showAvatarByMessageId.get(msg.id) ?? true}
                isDirect={isDirect}
                currentUserId={currentUserId}
                messageStatus={getMessageStatus(msg)}
              />
            ))}
          </React.Fragment>
        ))}

        {isStreaming && !isDirect && (
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
        <div ref={bottomRef} className="chat-message-list__anchor" />
      </div>
    </div>
  );
};
