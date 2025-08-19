import React from "react";
import { Button } from "antd";
import { GenerateButtonConfig } from "../../../../../types/aiAnswer";

interface GenerateButtonProps extends GenerateButtonConfig {
  onClick: () => void;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  text,
  icon,
  style,
  loading,
  onClick,
}) => {
  return (
    <Button
      className="create-new-post"
      onClick={onClick}
      loading={loading}
      icon={icon}
      style={style}
    >
      {text}
    </Button>
  );
};
