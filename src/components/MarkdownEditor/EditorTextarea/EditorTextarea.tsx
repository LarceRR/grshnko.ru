import React, { useEffect, useRef } from "react";
import { Entity } from "../types";
import { formatTextToHTML } from "../utils/formatting";

interface EditorTextareaProps {
  text: string;
  entities: Entity[];
  editorRef: React.RefObject<HTMLDivElement | null>;
  onChange: (text: string) => void;
  onSelect: () => void;
  forceUpdate?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const EditorTextarea: React.FC<EditorTextareaProps> = ({
  text,
  entities,
  editorRef,
  onChange,
  onSelect,
  forceUpdate = false,
  onUndo,
  onRedo,
}) => {
  const prevTextRef = useRef<string>("");
  const prevEntitiesRef = useRef<Entity[]>([]);
  const isUserInputRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Инициализация при первом рендере
  useEffect(() => {
    if (!editorRef.current || isInitializedRef.current) return;
    if (text || entities.length > 0) {
      editorRef.current.innerHTML = formatTextToHTML(text, entities);
      prevTextRef.current = text;
      prevEntitiesRef.current = entities;
      isInitializedRef.current = true;
    }
  }, [text, entities, editorRef]);

  // Синхронизируем HTML только если текст или entities изменились извне
  useEffect(() => {
    if (!editorRef.current || !isInitializedRef.current) return;

    const textChanged = prevTextRef.current !== text;
    const entitiesChanged =
      prevEntitiesRef.current.length !== entities.length ||
      prevEntitiesRef.current.some(
        (e, i) =>
          e.type !== entities[i]?.type ||
          e.offset !== entities[i]?.offset ||
          e.length !== entities[i]?.length ||
          (e.type === "text_url" &&
            entities[i]?.type === "text_url" &&
            e.url !== entities[i].url)
      );

    // Если это изменение от пользователя (ввод текста), не обновляем HTML
    if (isUserInputRef.current && textChanged && !forceUpdate) {
      isUserInputRef.current = false;
      prevTextRef.current = text;
      prevEntitiesRef.current = entities;
      return;
    }

    // Обновляем HTML если:
    // 1. Текст изменился извне (например, через props или undo/redo)
    // 2. Entities изменились
    // 3. Принудительное обновление (forceUpdate)
    if (textChanged || entitiesChanged || forceUpdate) {
      editorRef.current.innerHTML = formatTextToHTML(text, entities);
      prevTextRef.current = text;
      prevEntitiesRef.current = entities;
    }
  }, [text, entities, editorRef, forceUpdate]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const plainText = editorRef.current.innerText;
    isUserInputRef.current = true;
    onChange(plainText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl+Z или Cmd+Z для undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      onUndo?.();
      return;
    }

    // Ctrl+Shift+Z или Ctrl+Y или Cmd+Shift+Z для redo
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.shiftKey ? e.key === "z" : e.key === "y")
    ) {
      e.preventDefault();
      onRedo?.();
      return;
    }
  };

  return (
    <div
      ref={editorRef}
      className="markdown-editor__textarea"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onSelect={onSelect}
      onKeyDown={handleKeyDown}
    />
  );
};

export default EditorTextarea;
