import React from "react";
import { Button, Input } from "antd";
import { X } from "lucide-react";

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
      <div className="tiktok-input">
        <Input
          className="generate-post-input"
          style={{ height: "auto", resize: "none" }}
          onChange={(e) => onUrlChange(e.target.value)}
          value={videoUrl}
          placeholder={placeholder}
        />
        {videoUrl && (
          <X onClick={() => onUrlChange("")} size={16} color="#C9D1D9" />
        )}
      </div>
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
