import React, { useState, useEffect } from "react";
import { Input, Button } from "antd";
import "./EditMessageInline.scss";

const { TextArea } = Input;

interface EditMessageInlineProps {
  messageId: string;
  initialContent: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export const EditMessageInline: React.FC<EditMessageInlineProps> = ({
  initialContent,
  onSubmit,
  onCancel,
}) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div className="edit-message-inline">
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoSize={{ minRows: 1, maxRows: 10 }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (content.trim()) onSubmit(content.trim());
          }
          if (e.key === "Escape") onCancel();
        }}
        className="edit-message-inline__input"
      />
      <div className="edit-message-inline__actions">
        <Button onClick={onCancel}>Отмена</Button>
        <Button
          type="primary"
          onClick={() => content.trim() && onSubmit(content.trim())}
          disabled={!content.trim()}
        >
          Сохранить и отправить
        </Button>
      </div>
    </div>
  );
};
