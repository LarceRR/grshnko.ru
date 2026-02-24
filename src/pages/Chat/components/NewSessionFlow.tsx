import React, { useState } from "react";
import { Modal, Input, Spin } from "antd";
import type { ChatAgent } from "../../../types/chat.types";
import "./NewSessionFlow.scss";

interface NewSessionFlowProps {
  open: boolean;
  agents: ChatAgent[];
  onSelect: (agentId: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const NewSessionFlow: React.FC<NewSessionFlowProps> = ({
  open,
  agents,
  onSelect,
  onCancel,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const agentList = Array.isArray(agents) ? agents : [];

  const filtered = search.trim()
    ? agentList.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.description &&
            a.description.toLowerCase().includes(search.toLowerCase())) ||
          a.labels?.some((l) => l.toLowerCase().includes(search.toLowerCase())),
      )
    : agentList;

  return (
    <Modal
      title="Новый чат — выберите агента"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
      destroyOnClose
      className="new-session-flow"
    >
      <Input
        placeholder="Поиск по имени, описанию или тегам…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        className="new-session-flow__search"
      />
      {loading ? (
        <div className="new-session-flow__loading">
          <Spin />
        </div>
      ) : (
        <div className="new-session-flow__grid">
          {filtered.map((agent) => (
            <button
              type="button"
              key={agent.id}
              className="new-session-flow__card"
              onClick={() => onSelect(agent.id)}
            >
              {agent.avatar && (
                <img
                  src={agent.avatar}
                  alt=""
                  className="new-session-flow__card-avatar"
                />
              )}
              <span className="new-session-flow__card-name">{agent.name}</span>
              {agent.description && (
                <p className="new-session-flow__card-desc">
                  {agent.description}
                </p>
              )}
              {agent.labels?.length > 0 && (
                <div className="new-session-flow__card-labels">
                  {agent.labels.slice(0, 4).map((l) => (
                    <span key={l} className="new-session-flow__card-tag">
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="new-session-flow__empty">Нет подходящих агентов</div>
      )}
    </Modal>
  );
};
