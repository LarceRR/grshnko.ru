import React, { useState, useRef, useEffect } from "react";
import "./MarkdownEditor.scss";
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
} from "lucide-react";

export type Entity =
  | {
      type:
        | "bold"
        | "italic"
        | "underline"
        | "strikethrough"
        | "spoiler"
        | "code";
      offset: number;
      length: number;
    }
  | { type: "text_url"; offset: number; length: number; url: string };

interface HistoryState {
  text: string;
  entities: Entity[];
}

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onEntitiesChange?: (entities: Entity[]) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onEntitiesChange,
}) => {
  const [internalText, setInternalText] = useState("");
  const text = value !== undefined ? value : internalText;

  const [entities, setEntities] = useState<Entity[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeFormats, setActiveFormats] = useState<Set<Entity["type"]>>(
    new Set()
  );

  const editorRef = useRef<HTMLDivElement>(null);

  // --- История ---
  const pushHistory = (newText: string, newEntities: Entity[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, { text: newText, entities: newEntities }]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setInternalText(prev.text);
    setEntities(prev.entities);
    onChange?.(prev.text);
    onEntitiesChange?.(prev.entities);
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setInternalText(next.text);
    setEntities(next.entities);
    onChange?.(next.text);
    onEntitiesChange?.(next.entities);
    setHistoryIndex(historyIndex + 1);
  };

  // --- Преобразование текста в HTML для contentEditable ---
  const formatTextToHTML = (rawText: string, entities: Entity[]) => {
    const htmlParts: string[] = [];

    for (let i = 0; i < rawText.length; i++) {
      let openTags = "";
      let closeTags = "";

      entities.forEach((e) => {
        if (i === e.offset) {
          switch (e.type) {
            case "bold":
              openTags += "<b>";
              break;
            case "italic":
              openTags += "<i>";
              break;
            case "underline":
              openTags += "<u>";
              break;
            case "strikethrough":
              openTags += "<s>";
              break;
            case "spoiler":
              openTags += `<span class="spoiler">`;
              break;
            case "code":
              openTags += "<code>";
              break;
            case "text_url":
              openTags += `<a href="${e.url}" target="_blank">`;
              break;
          }
        }
        if (i === e.offset + e.length) {
          switch (e.type) {
            case "bold":
              closeTags = "</b>" + closeTags;
              break;
            case "italic":
              closeTags = "</i>" + closeTags;
              break;
            case "underline":
              closeTags = "</u>" + closeTags;
              break;
            case "strikethrough":
              closeTags = "</s>" + closeTags;
              break;
            case "spoiler":
              closeTags = `</span>` + closeTags;
              break;
            case "code":
              closeTags = "</code>" + closeTags;
              break;
            case "text_url":
              closeTags = "</a>" + closeTags;
              break;
          }
        }
      });

      htmlParts.push(closeTags + openTags + rawText[i]);
    }

    // Закрываем теги в конце
    entities.forEach((e) => {
      const end = e.offset + e.length;
      if (end === rawText.length) {
        switch (e.type) {
          case "bold":
            htmlParts.push("</b>");
            break;
          case "italic":
            htmlParts.push("</i>");
            break;
          case "underline":
            htmlParts.push("</u>");
            break;
          case "strikethrough":
            htmlParts.push("</s>");
            break;
          case "spoiler":
            htmlParts.push("</span>");
            break;
          case "code":
            htmlParts.push("</code>");
            break;
          case "text_url":
            htmlParts.push("</a>");
            break;
        }
      }
    });

    return htmlParts.join("");
  };

  const applyFormatting = (type: Entity["type"]) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    const isActive = activeFormats.has(type);

    let newEntities = [...entities];

    if (isActive) {
      // Удаляем форматирование
      newEntities = newEntities.filter(
        (e) =>
          !(
            e.type === type &&
            startOffset >= e.offset &&
            endOffset <= e.offset + e.length
          )
      );
    } else {
      // Добавляем форматирование
      if (type === "text_url") {
        const url = prompt("Введите ссылку") || "";
        newEntities.push({
          type: "text_url",
          offset: startOffset,
          length: selectedText.length,
          url,
        });
      } else {
        newEntities.push({
          type,
          offset: startOffset,
          length: selectedText.length,
        });
      }
    }

    setEntities(newEntities);

    // Обновляем HTML
    const newHTML = formatTextToHTML(text, newEntities);
    editorRef.current.innerHTML = newHTML;

    // Обновляем plain text
    onChange?.(text);
    onEntitiesChange?.(newEntities);

    pushHistory(text, newEntities);
  };

  const clearFormatting = () => {
    setEntities([]);
    onEntitiesChange?.([]);
    editorRef.current!.innerText = text;
    pushHistory(text, []);
  };

  const clearAll = () => {
    setInternalText("");
    setEntities([]);
    onChange?.("");
    onEntitiesChange?.([]);
    editorRef.current!.innerText = "";
    setHistory([]);
    setHistoryIndex(-1);
  };

  const updateActiveFormats = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const start = range.startOffset;
    const end = range.endOffset;

    const active = new Set<Entity["type"]>();
    entities.forEach((e) => {
      if (start >= e.offset && end <= e.offset + e.length) {
        active.add(e.type);
      }
    });
    setActiveFormats(active);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = formatTextToHTML(text, entities);
    }
  }, []);

  const hasText = text.length > 0;

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__toolbar">
        <div className="toolbar__buttons">
          <button onClick={undo} disabled={!hasText || historyIndex <= 0}>
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!hasText || historyIndex >= history.length - 1}
          >
            <ChevronRight size={16} />
          </button>
          {(
            [
              "bold",
              "italic",
              "underline",
              "strikethrough",
              "spoiler",
              "code",
              "text_url",
            ] as Entity["type"][]
          ).map((type) => {
            const icons: Record<string, React.ReactNode> = {
              bold: <Bold size={16} />,
              italic: <Italic size={16} />,
              underline: <Underline size={16} />,
              strikethrough: <Strikethrough size={16} />,
              spoiler: <Ghost size={16} />,
              code: <Code size={16} />,
              text_url: <LinkIcon size={16} />,
            };
            return (
              <button
                key={type}
                onClick={() => applyFormatting(type)}
                title={type}
                className={activeFormats.has(type) ? "active" : ""}
                disabled={!hasText}
              >
                {icons[type]}
              </button>
            );
          })}
          <button
            onClick={clearFormatting}
            title="Сброс форматирования"
            disabled={!hasText}
          >
            <X size={16} />
          </button>
          <button onClick={clearAll} title="Очистить всё" disabled={!hasText}>
            <Trash size={16} />
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className="markdown-editor__textarea"
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          const plainText = editorRef.current!.innerText;
          if (value === undefined) setInternalText(plainText);
          onChange?.(plainText);
          pushHistory(plainText, entities);
        }}
        onSelect={updateActiveFormats}
      />
    </div>
  );
};

export default MarkdownEditor;
