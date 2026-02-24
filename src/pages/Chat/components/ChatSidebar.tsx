import React from "react";
import { Button } from "antd";
import { Plus } from "lucide-react";
import { ChatSessionItem } from "./ChatSessionItem";
import type { ChatSession } from "../../../types/chat.types";
import "./ChatSidebar.scss";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isLoading?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isLoading,
}) => {
  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__header">
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={onNewChat}
          block
          className="chat-sidebar__new-btn"
        >
          Новый чат
        </Button>
      </div>
      <div className="chat-sidebar__list">
        {isLoading ? (
          <div className="chat-sidebar__loading">Загрузка…</div>
        ) : sessions.length === 0 ? (
          <div className="chat-sidebar__empty">Нет сессий</div>
        ) : (
          sessions.map((s) => (
            <ChatSessionItem
              key={s.id}
              session={s}
              isActive={s.id === activeSessionId}
              onSelect={() => onSelectSession(s.id)}
              onDelete={() => onDeleteSession(s.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
};
