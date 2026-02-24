import React from "react";
import { Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import "./ToolCallHeader.scss";

interface ToolCallHeaderProps {
  toolName: string;
  status: "running" | "done" | "error";
  expanded: boolean;
  onToggle: () => void;
}

const statusLabels = {
  running: "Выполняется…",
  done: "Готово",
  error: "Ошибка",
};

/** Map technical tool names to user-friendly Russian labels */
const toolDisplayNames: Record<string, string> = {
  showQuestionnaire: "Уточняю детали",
  createLedStripAnimation: "Создаю анимацию",
  generateTheme: "Генерирую тему",
  createAgent: "Создаю агента",
  readFile: "Читаю файл",
  writeFile: "Записываю файл",
  editFile: "Редактирую файл",
  executeCode: "Выполняю код",
};

function getToolDisplayName(toolName: string): string {
  return toolDisplayNames[toolName] ?? toolName;
}

export const ToolCallHeader: React.FC<ToolCallHeaderProps> = ({
  toolName,
  status,
  expanded,
  onToggle,
}) => {
  const Icon = status === "running" ? Loader2 : status === "error" ? X : Check;

  return (
    <button
      type="button"
      className={`tool-call-header tool-call-header--${status}`}
      onClick={onToggle}
    >
      <span className="tool-call-header__icon">
        {status === "running" ? (
          <Loader2 size={16} className="tool-call-header__spinner" />
        ) : (
          <Icon size={16} />
        )}
      </span>
      <span className="tool-call-header__name">{getToolDisplayName(toolName)}</span>
      <span className="tool-call-header__status">{statusLabels[status]}</span>
      <span className="tool-call-header__chevron">
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    </button>
  );
};
