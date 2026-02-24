import React from "react";
import { Select } from "antd";
import type { ChatAgent } from "../../../types/chat.types";
import "./AgentSelector.scss";

interface AgentSelectorProps {
  agents: ChatAgent[];
  value: string | null;
  onChange: (agentId: string) => void;
  disabled?: boolean;
  currentUserId?: string | null;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  value,
  onChange,
  disabled,
  currentUserId,
}) => {
  const builtIn = agents.filter((a) => a.isBuiltIn);
  const publicAgents = agents.filter((a) => a.isPublic && !a.isBuiltIn);
  const myAgents = agents.filter(
    (a) =>
      !a.isBuiltIn &&
      (a as ChatAgent & { authorId?: string }).authorId === currentUserId,
  );
  const other = agents.filter(
    (a) =>
      !a.isBuiltIn &&
      !a.isPublic &&
      (a as ChatAgent & { authorId?: string }).authorId !== currentUserId,
  );

  const options: {
    label: React.ReactNode;
    options: { value: string; label: string }[];
  }[] = [];
  if (builtIn.length) {
    options.push({
      label: "Встроенные",
      options: builtIn.map((a) => ({ value: a.id, label: a.name })),
    });
  }
  if (publicAgents.length) {
    options.push({
      label: "Публичные",
      options: publicAgents.map((a) => ({ value: a.id, label: a.name })),
    });
  }
  if (myAgents.length) {
    options.push({
      label: "Мои агенты",
      options: myAgents.map((a) => ({ value: a.id, label: a.name })),
    });
  }
  if (other.length) {
    options.push({
      label: "Другие",
      options: other.map((a) => ({ value: a.id, label: a.name })),
    });
  }

  const flatOptions = options.flatMap((g) => g.options);

  return (
    <Select
      className="agent-selector"
      placeholder="Агент"
      value={value || undefined}
      onChange={onChange}
      disabled={disabled}
      options={options}
      optionFilterProp="label"
      showSearch
      filterOption={(input, opt) =>
        (opt?.label ?? "")
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      notFoundContent={flatOptions.length === 0 ? "Нет агентов" : undefined}
    />
  );
};
