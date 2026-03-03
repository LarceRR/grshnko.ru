import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Check, Palette } from "lucide-react";
import { useSelectedTheme } from "../../../../contexts/SelectedThemeContext";
import { getTheme } from "../../../../api/themes";
import type { Theme } from "../../../../types/theme";
import "./ChatArtifactsSidebar.scss";

interface ArtifactThemeCardProps {
  themeId: string;
  data: Record<string, unknown>;
}

export const ArtifactThemeCard: React.FC<ArtifactThemeCardProps> = ({
  themeId,
  data,
}) => {
  const navigate = useNavigate();
  const { selectedThemeId, applyAndSelectTheme } = useSelectedTheme();
  const name = (data.name as string) ?? "Тема";
  const colors = (data.colors as Record<string, string>) ?? {};
  const type = (data.type as string) ?? "custom";
  const isSelected = selectedThemeId === themeId;

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const theme: Theme = await getTheme(themeId);
      await applyAndSelectTheme(theme);
    } catch {
      // notify on error
    }
  };

  const entries = Object.entries(colors).slice(0, 10);

  return (
    <div
      className={`artifact-card artifact-card--theme ${isSelected ? "artifact-card--selected" : ""}`}
      onClick={() => navigate(`/system/themes/${themeId}`)}
      onKeyDown={(e) =>
        e.key === "Enter" && navigate(`/system/themes/${themeId}`)
      }
      role="button"
      tabIndex={0}
    >
      <div
        className="artifact-card__theme-preview"
        style={{
          backgroundColor:
            colors["button-primary-bg"] ??
            colors["--button-primary-bg"] ??
            "var(--card-background)",
        }}
      />
      <div className="artifact-card__theme-info">
        <span className="artifact-card__theme-name">{name}</span>
        <span className="artifact-card__theme-type">
          {type === "light"
            ? "Светлая"
            : type === "dark"
              ? "Тёмная"
              : "Пользовательская"}
        </span>
        {entries.length > 0 && (
          <div className="artifact-card__theme-swatches">
            {entries.map(([key, value]) => (
              <span
                key={key}
                className="artifact-card__theme-swatch"
                style={{ background: value }}
                title={`${key}: ${value}`}
              />
            ))}
          </div>
        )}
      </div>
      <Button
        type="primary"
        size="small"
        className={`artifact-card__apply-btn ${isSelected ? "artifact-card__apply-btn--selected" : ""}`}
        disabled={isSelected}
        onClick={handleApply}
        icon={isSelected ? <Check size={14} /> : <Palette size={14} />}
      >
        {isSelected ? "Выбрана" : "Применить"}
      </Button>
    </div>
  );
};
