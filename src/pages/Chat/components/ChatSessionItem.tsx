import React from "react";
import { Popconfirm, Button } from "antd";
import { MessageSquare, Trash2 } from "lucide-react";
import type { ChatSession } from "../../../types/chat.types";
import "./ChatSessionItem.scss";

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
}) => {
  const title = session.title || "Новый чат";
  const preview = session.lastMessage?.content
    ? session.lastMessage.content.slice(0, 60) +
      (session.lastMessage.content.length > 60 ? "…" : "")
    : null;
  const time = session.lastMessage?.createdAt
    ? new Date(session.lastMessage.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`chat-session-item ${isActive ? "chat-session-item--active" : ""}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <span className="chat-session-item__icon">
        <MessageSquare size={16} />
      </span>
      <div className="chat-session-item__content">
        <span className="chat-session-item__title">{title}</span>
        {session.agent?.name && (
          <span className="chat-session-item__agent">{session.agent.name}</span>
        )}
        {preview && <p className="chat-session-item__preview">{preview}</p>}
        {time && <span className="chat-session-item__time">{time}</span>}
      </div>
      <Popconfirm
        title="Удалить сессию?"
        description="Все сообщения будут удалены."
        onConfirm={(e) => {
          e?.stopPropagation();
          onDelete();
        }}
        onCancel={(e) => e?.stopPropagation()}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={14} />}
          className="chat-session-item__delete"
          onClick={(e) => e.stopPropagation()}
        />
      </Popconfirm>
    </div>
  );
};
