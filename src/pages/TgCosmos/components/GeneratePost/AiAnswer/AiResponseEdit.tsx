import React, { useEffect, useRef } from "react";
import { Input } from "antd";
import { AiResponseEditProps } from "../../../../../types/aiAnswer";
import { X } from "lucide-react";

const { TextArea } = Input;

export const AiResponseEdit: React.FC<AiResponseEditProps> = ({
  content,
  wrapperRef,
  onChange,
  onBlur,
  isEditing,
}) => {
  const textAreaRef = useRef<any>(null);

  useEffect(() => {
    if (isEditing && textAreaRef.current?.resizableTextArea?.textArea) {
      const el = textAreaRef.current.resizableTextArea
        .textArea as HTMLTextAreaElement;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length); // курсор в конец
    }
  }, [isEditing]);

  return (
    <div ref={wrapperRef} className="ai-response-edit__wrapper">
      <TextArea
        ref={textAreaRef}
        showCount
        className="generate-post-input"
        maxLength={1500}
        style={{ resize: "none" }}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        autoSize={{ minRows: 6, maxRows: 12 }}
        onBlur={onBlur}
      />
      {content && <X onClick={() => onChange("")} size={16} color="#C9D1D9" />}
    </div>
  );
};
