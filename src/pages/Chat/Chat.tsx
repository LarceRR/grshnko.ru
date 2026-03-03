import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  setActiveSessionId,
  setChatQuestionnaire,
} from "../../features/chatSlice";
import { useChatSession, useChatSessions } from "../../hooks/useChatSessions";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useChat, mapToolResultToQuestionnaire } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useBranching } from "../../hooks/useBranching";
import { ChatMessageList } from "./components/ChatMessageList";
import { ChatInputBar } from "./components/ChatInputBar";
import { ChatWelcome } from "./components/ChatWelcome";
import { ChatSidebar } from "./components/ChatSidebar";
import { AgentSwitchModal } from "./components/AgentSwitchModal";
import { NewSessionFlow } from "./components/NewSessionFlow";
import { SessionTitleEditor } from "./components/SessionTitleEditor";
import { ChatArtifactsSidebar } from "./components/ChatArtifactsSidebar/ChatArtifactsSidebar";
import { ChatFilesSidebar } from "./components/ChatFilesSidebar/ChatFilesSidebar";
import { extractArtifactsFromMessages } from "../../utils/chatArtifacts";
import { Menu, MessageSquarePlus, Folder, Box } from "lucide-react";
import { Button, Drawer, Spin, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../../api/chat";
import { getUser } from "../../api/user";
import { ChatActionProvider } from "./context/ChatActionContext";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import "./Chat.scss";

function formatLastSeen(dateStr?: string | null): string {
  if (!dateStr) return "давно";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} ч. назад`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function Chat() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const questionnaire = useAppSelector((s) => s.chat.questionnaire);
  const questionnaireSessionId = useAppSelector(
    (s) => s.chat.questionnaireSessionId,
  );
  const questionnaireForSession =
    questionnaireSessionId === sessionId ? questionnaire : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);
  const [agentSwitchModal, setAgentSwitchModal] = useState<{
    open: boolean;
    agentId: string | null;
  }>({ open: false, agentId: null });
  const [artifactsSidebarOpen, setArtifactsSidebarOpen] = useState(false);
  const [filesSidebarOpen, setFilesSidebarOpen] = useState(false);

  // Убираем padding у html на странице чата
  useEffect(() => {
    document.documentElement.setAttribute("data-page", "chat");
    return () => document.documentElement.removeAttribute("data-page");
  }, []);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });

  const {
    sessions,
    isLoading: sessionsLoading,
    createSession,
    updateSession,
    deleteSession,
  } = useChatSessions({ take: 50 });

  const { data: session, isLoading: sessionLoading } = useChatSession(
    sessionId ?? null,
  );
  const {
    messages,
    hasMore,
    isLoading: messagesLoading,
    isFetchingNextPage,
    fetchNextPage,
    invalidate,
  } = useChatMessages(sessionId ?? null, { limit: 100 });
  const {
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    streamingContent,
    toolCalls,
    pendingMessage,
    streamError,
    clearStreamError,
  } = useChat(sessionId ?? null);
  const { activateBranch } = useBranching(sessionId ?? null);
  useChatSocket(sessionId ?? null);

  const { data: agentsData } = useQuery({
    queryKey: ["chat", "agents"],
    queryFn: () => chatApi.getAgents({ take: 100 }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const agents = Array.isArray(agentsData?.data) ? agentsData.data : [];
  const agentSwitchTarget = agentSwitchModal.agentId
    ? (agents.find((a) => a.id === agentSwitchModal.agentId) ?? null)
    : null;

  useEffect(() => {
    dispatch(setActiveSessionId(sessionId ?? null));
    // Reset questionnaire when switching sessions
    if (sessionId) {
      dispatch(setChatQuestionnaire({ questionnaire: null, sessionId: null }));
    }
    return () => {
      dispatch(setActiveSessionId(null));
    };
  }, [sessionId, dispatch]);

  useEffect(() => {
    if (sessionId) invalidate();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId || !messages.length) return;
    if (questionnaireSessionId === sessionId && questionnaire) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "TOOL" || !Array.isArray(msg.toolResults)) continue;
      const withQuestionnaire = (
        msg.toolResults as Array<{
          displayType?: string;
          displayData?: unknown;
        }>
      ).find((tr) => tr.displayType === "questionnaire" && tr.displayData);
      if (withQuestionnaire?.displayData) {
        const mapped = mapToolResultToQuestionnaire(
          withQuestionnaire.displayData,
        );
        if (mapped?.options?.length) {
          dispatch(setChatQuestionnaire({ questionnaire: mapped, sessionId }));
        }
        break;
      }
    }
  }, [sessionId, messages, dispatch, questionnaireSessionId, questionnaire]);

  const handleNewChatSelect = async (agentId: string) => {
    setNewSessionModalOpen(false);
    try {
      const created = await createSession({ agentId });
      navigate(`/chat/${created.id}`, { replace: true });
      setSidebarOpen(false);
    } catch {
      // mutation error
    }
  };

  const handleAgentSelect = (agentId: string) => {
    if (!sessionId || session?.agentId === agentId) return;
    setAgentSwitchModal({ open: true, agentId });
  };

  const handleAgentSwitchNewSession = async () => {
    if (!agentSwitchTarget) return;
    setAgentSwitchModal({ open: false, agentId: null });
    try {
      const created = await createSession({ agentId: agentSwitchTarget.id });
      navigate(`/chat/${created.id}`, { replace: true });
    } catch {
      //
    }
  };

  const handleAgentSwitchInCurrent = async () => {
    if (!sessionId || !agentSwitchTarget) return;
    setAgentSwitchModal({ open: false, agentId: null });
    try {
      await updateSession({
        id: sessionId,
        data: { agentId: agentSwitchTarget.id },
      });
      invalidate();
    } catch {
      //
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (sessionId === id) {
        const rest = sessions?.data?.filter((s) => s.id !== id) ?? [];
        navigate(rest[0] ? `/chat/${rest[0].id}` : "/chat", { replace: true });
      }
    } catch {
      //
    }
  };

  const handleTitleSave = (title: string) => {
    if (sessionId) updateSession({ id: sessionId, data: { title } });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => message.success("Скопировано"),
      () => message.error("Не удалось скопировать"),
    );
  };

  const handleNavigateBranch = async (msgId: string, branchIndex: number) => {
    try {
      await activateBranch({ messageId: msgId, branchIndex });
      setEditingMessageId(null);
    } catch {
      message.error("Не удалось переключить ветку");
    }
  };

  const chatActions = useMemo(
    () => ({
      sendMessage,
      editMessage,
      regenerateMessage,
      stopGeneration,
      onEdit: setEditingMessageId,
      onCopy: handleCopy,
      onNavigateBranch: handleNavigateBranch,
      onSubmitEdit: async (msgId: string, content: string) => {
        setEditingMessageId(null);
        await editMessage(msgId, content);
      },
      onCancelEdit: () => setEditingMessageId(null),
      onQuestionnaireSelect: (
        option: any,
        context?: { callId: string; assistantMessageId: string },
      ) => {
        const answer = option.description
          ? `${option.description}\n\nМой ответ: ${option.title}`
          : option.title;
        sendMessage(
          answer,
          undefined,
          context ? { ...context, submittedText: answer } : undefined,
        );
        dispatch(
          setChatQuestionnaire({ questionnaire: null, sessionId: null }),
        );
      },
      onQuestionnaireSubmit: (
        text: string,
        context?: { callId: string; assistantMessageId: string },
      ) => {
        sendMessage(
          text,
          undefined,
          context ? { ...context, submittedText: text } : undefined,
        );
        dispatch(
          setChatQuestionnaire({ questionnaire: null, sessionId: null }),
        );
      },
      onQuestionnaireSkip: () => {
        sendMessage("Пропустить");
        dispatch(
          setChatQuestionnaire({ questionnaire: null, sessionId: null }),
        );
      },
    }),
    [sendMessage, editMessage, regenerateMessage, stopGeneration, dispatch],
  );

  const sessionsList = sessions?.data ?? [];
  const loading = sessionLoading || messagesLoading;
  const displayMessages = messages;
  const showWelcome = !loading && displayMessages.length === 0;
  const noSession = !sessionId || (!sessionLoading && !session);
  const isDirect = session?.type === "DIRECT";

  const peerUser = isDirect
    ? session?.peerUserId === user?.id
      ? session?.user
      : session?.peerUser
    : null;
  const peerDisplayName = peerUser
    ? [peerUser.firstName, peerUser.lastName].filter(Boolean).join(" ") ||
      peerUser.username
    : null;
  const peerIsOnline = !!peerUser?.isOnline;
  const peerLastSeenAt = peerUser?.lastLoginAt;

  const artifacts = useMemo(
    () => extractArtifactsFromMessages(messages),
    [messages],
  );

  const mainContent = noSession ? (
    <>
      {sessionsList.length > 0 && (
        <div className="chat-page__mobile-session-list">
          <ChatSidebar
            sessions={sessionsList}
            activeSessionId={sessionId ?? null}
            onSelectSession={(id) => {
              navigate(`/chat/${id}`);
              setSidebarOpen(false);
            }}
            onNewChat={() => setNewSessionModalOpen(true)}
            onDeleteSession={handleDeleteSession}
            isLoading={sessionsLoading}
            currentUserId={user?.id ?? null}
          />
        </div>
      )}
      <div
        className={
          sessionsList.length > 0
            ? "chat-page__empty-state chat-page__empty-state--desktop-only"
            : "chat-page__empty-state"
        }
      >
        <MessageSquarePlus size={48} strokeWidth={1.2} />
        <h3 className="chat-page__empty-title">Создайте чат</h3>
        <p className="chat-page__empty-desc">
          Выберите агента и начните общение
        </p>
        <Button
          type="primary"
          size="large"
          onClick={() => setNewSessionModalOpen(true)}
          className="chat-page__empty-btn"
        >
          Новый чат
        </Button>
      </div>
    </>
  ) : (
    <>
      <div className="chat-page__header">
        <Button
          type="text"
          icon={<Menu size={20} />}
          onClick={() => setSidebarOpen(true)}
          className="chat-page__menu-btn mobile-only"
        />
        {isDirect && peerUser ? (
          <div
            className="chat-page__dm-header"
            onClick={() => navigate(`/profile/${peerUser.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate(`/profile/${peerUser.id}`)
            }
          >
            <UserAvatar
              avatarUrl={peerUser.avatarUrl}
              size={38}
              className="chat-page__dm-avatar"
            />
            <div className="chat-page__dm-info">
              <span className="chat-page__dm-name">{peerDisplayName}</span>
              <span className="chat-page__dm-status">
                {peerIsOnline
                  ? "в сети"
                  : `был(а) в сети ${formatLastSeen(peerLastSeenAt)}`}
              </span>
            </div>
          </div>
        ) : (
          <SessionTitleEditor
            title={session?.title ?? null}
            onSave={handleTitleSave}
            placeholder="Новый чат"
            className="chat-page__title"
          />
        )}
        {!isDirect && (
          <div className="chat-page__header-actions">
            <Button
              type="text"
              icon={<Folder size={20} />}
              onClick={() => {
                setFilesSidebarOpen(!filesSidebarOpen);
                if (artifactsSidebarOpen) setArtifactsSidebarOpen(false);
              }}
              className="chat-page__header-btn"
              title="Файлы"
            />
            <Button
              type="text"
              icon={<Box size={20} />}
              onClick={() => {
                setArtifactsSidebarOpen(!artifactsSidebarOpen);
                if (filesSidebarOpen) setFilesSidebarOpen(false);
              }}
              className="chat-page__header-btn"
              title="Артефакты"
            />
          </div>
        )}
      </div>

      <div className="chat-page__body">
        {loading ? (
          <div className="chat-page__loading">
            <Spin size="large" />
          </div>
        ) : (
          <ChatActionProvider {...chatActions}>
            {showWelcome && !isDirect && session?.agent ? (
              <ChatWelcome agent={session.agent} />
            ) : (
              <ChatMessageList
                messages={displayMessages}
                allMessages={messages}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
                pendingMessage={pendingMessage ?? undefined}
                editingMessageId={editingMessageId}
                streamError={streamError}
                onDismissError={clearStreamError}
                questionnaire={questionnaireForSession}
                toolCalls={toolCalls}
                userAvatarUrl={user?.avatarUrl}
                peerAvatarUrl={isDirect ? (peerUser?.avatarUrl ?? null) : null}
                sessionId={sessionId ?? null}
                lastReadSequenceNumber={session?.lastReadSequenceNumber ?? 0}
                peerLastReadSequenceNumber={session?.peerLastReadSequenceNumber}
                hasMore={hasMore}
                isFetchingMore={isFetchingNextPage}
                onLoadMore={fetchNextPage}
                isDirect={isDirect}
                currentUserId={user?.id ?? null}
              />
            )}
          </ChatActionProvider>
        )}
      </div>

      <div className="chat-page__footer">
        <ChatInputBar
          onSend={sendMessage}
          onStop={stopGeneration}
          disabled={!sessionId}
          isStreaming={isStreaming}
          sessionId={sessionId}
          agents={agents}
          currentAgentId={session?.agentId ?? null}
          onAgentChange={handleAgentSelect}
          currentUserId={user?.id ?? null}
          isDirect={isDirect}
        />
      </div>
    </>
  );

  return (
    <div className="chat-page">
      <div className="chat-page__sidebar-desktop">
        <ChatSidebar
          sessions={sessionsList}
          activeSessionId={sessionId ?? null}
          onSelectSession={(id) => {
            navigate(`/chat/${id}`);
            setSidebarOpen(false);
          }}
          onNewChat={() => setNewSessionModalOpen(true)}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionsLoading}
          currentUserId={user?.id ?? null}
        />
      </div>

      <div className="chat-page__main">{mainContent}</div>

      {!noSession && artifactsSidebarOpen && (
        <div className="chat-page__artifacts-desktop">
          <ChatArtifactsSidebar artifacts={artifacts} />
        </div>
      )}

      {!noSession && filesSidebarOpen && (
        <div className="chat-page__files-desktop">
          <ChatFilesSidebar />
        </div>
      )}

      <Drawer
        title="Чаты"
        placement="left"
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
        width={300}
        className="chat-page__drawer"
      >
        <ChatSidebar
          sessions={sessionsList}
          activeSessionId={sessionId ?? null}
          onSelectSession={(id) => {
            navigate(`/chat/${id}`);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            setSidebarOpen(false);
            setNewSessionModalOpen(true);
          }}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionsLoading}
          currentUserId={user?.id ?? null}
        />
      </Drawer>

      <NewSessionFlow
        open={newSessionModalOpen}
        agents={agents}
        onSelect={handleNewChatSelect}
        onCancel={() => setNewSessionModalOpen(false)}
      />

      <AgentSwitchModal
        open={agentSwitchModal.open}
        agent={agentSwitchTarget}
        onStartNew={handleAgentSwitchNewSession}
        onSwitchInCurrent={handleAgentSwitchInCurrent}
        onCancel={() => setAgentSwitchModal({ open: false, agentId: null })}
      />
    </div>
  );
}
