import React from "react";
import { Modal, Button } from "antd";
import type { ChatAgent } from "../../../types/chat.types";
import "./AgentSwitchModal.scss";

interface AgentSwitchModalProps {
  open: boolean;
  agent: ChatAgent | null;
  onStartNew: () => void;
  onSwitchInCurrent: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AgentSwitchModal: React.FC<AgentSwitchModalProps> = ({
  open,
  agent,
  onStartNew,
  onSwitchInCurrent,
  onCancel,
  loading,
}) => {
  return (
    <Modal
      title="Сменить агента"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="agent-switch-modal"
    >
      <p className="agent-switch-modal__text">
        Выбран агент <strong>{agent?.name}</strong>. Что сделать?
      </p>
      <div className="agent-switch-modal__actions">
        <Button type="primary" onClick={onStartNew} loading={loading}>
          Новая сессия
        </Button>
        <Button onClick={onSwitchInCurrent} loading={loading}>
          Сменить в текущей сессии
        </Button>
        <Button onClick={onCancel}>Отмена</Button>
      </div>
    </Modal>
  );
};
