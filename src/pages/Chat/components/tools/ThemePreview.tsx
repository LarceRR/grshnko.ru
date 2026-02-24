import React from "react";
import "./ThemePreview.scss";

interface ThemePreviewProps {
  data: Record<string, unknown>;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ data }) => {
  const colors = data.colors as Record<string, string> | undefined;
  if (!colors || typeof colors !== "object") return null;

  const entries = Object.entries(colors).slice(0, 12);

  return (
    <div className="theme-preview">
      <div className="theme-preview__swatches">
        {entries.map(([key, value]) => (
          <span
            key={key}
            className="theme-preview__swatch"
            style={{ background: value }}
            title={`${key}: ${value}`}
          />
        ))}
      </div>
    </div>
  );
};
