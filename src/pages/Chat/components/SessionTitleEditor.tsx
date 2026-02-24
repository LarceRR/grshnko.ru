import React, { useState, useRef, useEffect } from "react";
import { Input } from "antd";
import "./SessionTitleEditor.scss";

interface SessionTitleEditorProps {
  title: string | null;
  onSave: (title: string) => void;
  placeholder?: string;
  className?: string;
}

export const SessionTitleEditor: React.FC<SessionTitleEditorProps> = ({
  title,
  onSave,
  placeholder = "Без названия",
  className,
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(title || "");
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    const v = value.trim();
    if (v && v !== (title || "")) onSave(v);
    else setValue(title || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = value.trim();
      if (v) onSave(v);
      setEditing(false);
    }
    if (e.key === "Escape") {
      setValue(title || "");
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef as React.RefObject<any>}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`session-title-editor__input ${className ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      className={`session-title-editor ${!title ? "session-title-editor--muted" : ""} ${className ?? ""}`}
      onClick={() => setEditing(true)}
    >
      {title || placeholder}
    </button>
  );
};
