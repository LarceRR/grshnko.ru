import React from "react";
import Markdown from "react-markdown";

interface AiResponseViewProps {
  content: string;
  isLocked: boolean;
  onToggleEdit: () => void;
}

export const AiResponseView: React.FC<AiResponseViewProps> = ({
  content,
  isLocked,
  onToggleEdit,
}) => {
  return (
    <div
      className="generate-post-input generate-post-input-wrapper"
      onClick={onToggleEdit}
      style={{ cursor: isLocked ? "default" : "pointer" }}
    >
      <Markdown>{content}</Markdown>
    </div>
  );
};
