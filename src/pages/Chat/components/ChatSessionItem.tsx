import React, { useState, useRef, useCallback } from "react";
import { Popconfirm, Button } from "antd";
import { Trash2 } from "lucide-react";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";
import type { ChatSession } from "../../../types/chat.types";
import { API_URL } from "../../../config";
import "./ChatSessionItem.scss";

const SWIPE_ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = 40;

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  currentUserId?: string | null;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
  currentUserId,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartOffset = useRef<number>(0);

  const isDirect = session.type === "DIRECT";

  const peerUser = isDirect
    ? session.peerUserId === currentUserId
      ? session.user
      : session.peerUser
    : null;

  const peerDisplayName = peerUser
    ? [peerUser.firstName, peerUser.lastName].filter(Boolean).join(" ") ||
      peerUser.username
    : null;

  const title = isDirect
    ? (peerDisplayName ?? "Личный чат")
    : session.title || "Новый чат";

  const subtitle = isDirect
    ? (peerUser?.username ?? null)
    : (session.agent?.name ?? null);

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

  const unread = session.unreadCount ?? 0;

  const avatarUrl = isDirect ? peerUser?.avatarUrl : session.agent?.avatar;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartOffset.current = swipeOffset;
    },
    [swipeOffset],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      const next = Math.max(
        -SWIPE_ACTION_WIDTH,
        Math.min(0, touchStartOffset.current + dx),
      );
      setSwipeOffset(next);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setSwipeOffset((prev) =>
      prev > -SWIPE_THRESHOLD ? 0 : -SWIPE_ACTION_WIDTH,
    );
  }, []);

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      if (swipeOffset !== 0) {
        setSwipeOffset(0);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onSelect();
    },
    [onSelect, swipeOffset],
  );

  const deleteConfirm = (
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
        className="chat-session-item__delete-btn"
        onClick={(e) => e.stopPropagation()}
      />
    </Popconfirm>
  );

  return (
    <div
      className={`chat-session-item ${isActive ? "chat-session-item--active" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="chat-session-item__swipe-actions">
        <div className="chat-session-item__swipe-actions-inner">
          {deleteConfirm}
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className="chat-session-item__row"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
      >
        <div className="chat-session-item__avatar">
          {isDirect ? (
            <UserAvatar avatarUrl={avatarUrl} size={36} />
          ) : avatarUrl ? (
            <img
              src={`${API_URL}cdn/avatar/${avatarUrl}`}
              alt=""
              className="chat-session-item__agent-avatar"
            />
          ) : (
            <div className="chat-session-item__agent-avatar chat-session-item__agent-avatar--placeholder">
              AI
            </div>
          )}
        </div>
        <div className="chat-session-item__content">
          <div className="chat-session-item__title-row">
            <span className="chat-session-item__title">{title}</span>
            {time && <span className="chat-session-item__time">{time}</span>}
          </div>
          {subtitle && (
            <span className="chat-session-item__agent">
              {isDirect ? `@${subtitle}` : subtitle}
            </span>
          )}
          <div className="chat-session-item__bottom-row">
            {preview && <p className="chat-session-item__preview">{preview}</p>}
            {unread > 0 && !isActive && (
              <span className="chat-session-item__badge">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
        <div className="chat-session-item__delete chat-session-item__delete--desktop">
          {deleteConfirm}
        </div>
      </div>
    </div>
  );
};
