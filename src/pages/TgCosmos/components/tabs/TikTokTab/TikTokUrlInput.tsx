import React from "react";
import { Button, Input } from "antd";

interface TikTokUrlInputProps {
  videoUrl: string;
  isLoading: boolean;
  placeholder: string;
  onUrlChange: (url: string) => void;
  onDownload: () => void;
}

export const TikTokUrlInput: React.FC<TikTokUrlInputProps> = ({
  videoUrl,
  isLoading,
  onUrlChange,
  onDownload,
  placeholder,
}) => {
  return (
    <div className="tiktok-input-wrapper">
      <Input
        className="generate-post-input"
        style={{ height: "auto", resize: "none" }}
        onChange={(e) => onUrlChange(e.target.value)}
        value={videoUrl}
        placeholder={placeholder}
      />
      <Button
        type="primary"
        className="generate-post-button"
        onClick={onDownload}
        loading={isLoading}
        style={{
          backgroundColor: "var(--button-primary-bg)",
          border: "unset",
          color: "white",
        }}
      >
        {isLoading ? "Загрузка" : "Получить видео"}
      </Button>
    </div>
  );
};
