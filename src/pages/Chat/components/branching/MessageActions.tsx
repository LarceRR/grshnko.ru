import React from "react";
import { Tooltip, Button } from "antd";
import { Pencil, RefreshCw, Copy } from "lucide-react";
import type { ChatMessage } from "../../../../types/chat.types";
import { BranchNavigator } from "./BranchNavigator";
import "./MessageActions.scss";

interface MessageActionsProps {
  message: ChatMessage;
  branchInfo?: { currentIndex: number; totalBranches: number } | null;
  onEdit: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onCopy: (content: string) => void;
  onNavigateBranch: (messageId: string, branchIndex: number) => void;
  isStreaming?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  branchInfo,
  onEdit,
  onRegenerate,
  onCopy,
  onNavigateBranch,
  isStreaming,
}) => {
  if (isStreaming) return null;

  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";
  const content = message.content ?? "";

  return (
    <div className="message-actions">
      <div className="message-actions__row">
        {isUser && (
          <Tooltip title="Редактировать и отправить">
            <Button
              type="text"
              size="small"
              icon={<Pencil size={14} />}
              onClick={() => onEdit(message.id)}
              className="message-actions__btn"
            />
          </Tooltip>
        )}
        {isAssistant && (
          <Tooltip title="Перегенерировать ответ">
            <Button
              type="text"
              size="small"
              icon={<RefreshCw size={14} />}
              onClick={() => onRegenerate(message.id)}
              className="message-actions__btn"
            />
          </Tooltip>
        )}
        <Tooltip title="Копировать">
          <Button
            type="text"
            size="small"
            icon={<Copy size={14} />}
            onClick={() => onCopy(content)}
            className="message-actions__btn"
          />
        </Tooltip>
      </div>
      {branchInfo && branchInfo.totalBranches > 1 && (
        <BranchNavigator
          messageId={message.id}
          currentIndex={branchInfo.currentIndex}
          totalBranches={branchInfo.totalBranches}
          onNavigate={onNavigateBranch}
        />
      )}
    </div>
  );
};
