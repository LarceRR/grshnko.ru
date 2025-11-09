import React from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Ghost,
  ChevronLeft,
  ChevronRight,
  X,
  Trash,
  User,
  BellPlus,
} from "lucide-react";
import { Entity } from "../types";

interface ToolbarProps {
  hasText: boolean;
  activeFormats: Set<Entity["type"]>;
  historyIndex: number;
  historyLength: number;
  onFormat: (type: Entity["type"]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearFormatting: () => void;
  onClearAll: () => void;
  onInsertAuthorLink?: () => void;
  onInsertSubscribeLink?: () => void;
  canInsertAuthorLink?: boolean;
  canInsertSubscribeLink?: boolean;
}

const formatTypes: Entity["type"][] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "spoiler",
  "code",
  "text_url",
];

const formatIcons: Record<Entity["type"], React.ReactNode> = {
  bold: <Bold size={16} />,
  italic: <Italic size={16} />,
  underline: <Underline size={16} />,
  strikethrough: <Strikethrough size={16} />,
  spoiler: <Ghost size={16} />,
  code: <Code size={16} />,
  text_url: <LinkIcon size={16} />,
};

const Toolbar: React.FC<ToolbarProps> = ({
  hasText,
  activeFormats,
  historyIndex,
  historyLength,
  onFormat,
  onUndo,
  onRedo,
  onClearFormatting,
  onClearAll,
  onInsertAuthorLink,
  onInsertSubscribeLink,
  canInsertAuthorLink,
  canInsertSubscribeLink,
}) => {
  return (
    <div className="markdown-editor__toolbar">
      <div className="toolbar__buttons">
        <button onClick={onUndo} disabled={!hasText || historyIndex <= 0}>
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!hasText || historyIndex >= historyLength - 1}
        >
          <ChevronRight size={16} />
        </button>
        {formatTypes.map((type) => (
          <button
            key={type}
            onClick={() => onFormat(type)}
            title={type}
            className={activeFormats.has(type) ? "active" : ""}
            disabled={!hasText}
          >
            {formatIcons[type]}
          </button>
        ))}
        <button
          onClick={onInsertAuthorLink}
          title="Добавить ссылку на автора"
          disabled={!onInsertAuthorLink || !canInsertAuthorLink}
        >
          <User size={16} />
        </button>
        <button
          onClick={onInsertSubscribeLink}
          title="Добавить ссылку на канал"
          disabled={!onInsertSubscribeLink || !canInsertSubscribeLink}
        >
          <BellPlus size={16} />
        </button>
        <button
          onClick={onClearFormatting}
          title="Сброс форматирования"
          disabled={!hasText}
        >
          <X size={16} />
        </button>
        <button onClick={onClearAll} title="Очистить всё" disabled={!hasText}>
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
