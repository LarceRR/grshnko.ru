import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Tag } from "antd";
import { getThemes, generateTheme } from "../../../../api/themes";
import { getLLMModels } from "../../../../api/llmModels";
import { useSelectedTheme } from "../../../../contexts/SelectedThemeContext";
import { useNotify } from "../../../../hooks/useNotify";
import type { Theme } from "../../../../types/theme";
import { Check, Palette, Sparkles } from "lucide-react";
import "./ThemesPage.scss";

const TYPE_KEYS = [
  { value: "", label: "Все типы" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "custom", label: "Пользовательская" },
] as const;

export default function ThemesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();
  const { selectedThemeId, applyAndSelectTheme, clearAndDeselectTheme } =
    useSelectedTheme();

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [labelsFilter, setLabelsFilter] = useState<string>("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateModel, setGenerateModel] = useState<string | undefined>(
    undefined,
  );
  const [generating, setGenerating] = useState(false);

  const { data: themesList, isLoading: themesLoading } = useQuery({
    queryKey: ["themes", typeFilter, labelsFilter],
    queryFn: async () => {
      const res = await getThemes({
        take: 100,
        ...(typeFilter && { type: typeFilter as "light" | "dark" | "custom" }),
        ...(labelsFilter && { labels: labelsFilter.replace(/\s/g, "") }),
      });
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: themesForCount = [] } = useQuery({
    queryKey: ["themes", "counts", labelsFilter],
    queryFn: async () => {
      const res = await getThemes({
        take: 500,
        ...(labelsFilter && { labels: labelsFilter.replace(/\s/g, "") }),
      });
      return Array.isArray(res) ? res : [];
    },
  });

  const typeCounts = (() => {
    const all = themesForCount.length;
    const light = themesForCount.filter((t) => t.type === "light").length;
    const dark = themesForCount.filter((t) => t.type === "dark").length;
    const custom = themesForCount.filter((t) => t.type === "custom").length;
    return { all, light, dark, custom };
  })();

  const typeOptions = TYPE_KEYS.map(({ value, label }) => ({
    value,
    label:
      value === ""
        ? `Все типы (${typeCounts.all})`
        : `${label} (${typeCounts[value as keyof typeof typeCounts] ?? 0})`,
  }));

  const renderTypeOption = (
    option: { value?: unknown; label?: unknown },
    _info: { index: number },
  ) => {
    const value = String(option.value ?? "");
    const base =
      TYPE_KEYS.find((k) => k.value === value)?.label ??
      (option.label as string) ??
      "";
    const count =
      value === ""
        ? typeCounts.all
        : (typeCounts[value as keyof typeof typeCounts] ?? 0);
    return (
      <span>
        {base} <span className="type-option-count">{count}</span>
      </span>
    );
  };

  const { data: llmModels = [] } = useQuery({
    queryKey: ["llm-models"],
    queryFn: getLLMModels,
    retry: false,
  });

  const themes: Theme[] = themesList ?? [];

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      notify({
        title: "Введите описание темы",
        body: "Заполните поле перед генерацией",
        type: "warning",
      });
      return;
    }
    setGenerating(true);
    try {
      const theme = await generateTheme({
        prompt: generatePrompt.trim(),
        ...(generateModel && { model: generateModel }),
      });
      await queryClient.invalidateQueries({ queryKey: ["themes"] });
      notify({
        title: "Тема создана",
        body: `«${theme.name}» сгенерирована и добавлена в список`,
        type: "success",
      });
      setGeneratePrompt("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка генерации";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async (theme: Theme) => {
    try {
      await applyAndSelectTheme(theme);
      notify({
        title: "Тема применена",
        body: theme.name,
        type: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const handleReset = async () => {
    try {
      await clearAndDeselectTheme();
      notify({
        title: "Тема сброшена",
        body: "Используются стандартные стили",
        type: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const themeId = (t: Theme) => t.id ?? t._id;
  const allLabels = Array.from(
    new Set(themes.flatMap((t) => t.labels || [])),
  ).sort();

  return (
    <div className="themes-page">
      {contextHolder}

      <section className="themes-section themes-generate">
        <h2>
          <Sparkles size={20} />
          Генерация темы через LLM
        </h2>
        <div className="generate-form">
          <Input.TextArea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="Опишите тему, например: тёплые закатные тона, оранжевый и тёмный фон"
            rows={3}
            className="generate-prompt"
          />
          <div className="generate-row">
            <Select
              placeholder="Модель (необязательно)"
              allowClear
              value={generateModel || undefined}
              onChange={setGenerateModel}
              options={llmModels
                .filter((m) => m.isActive)
                .map((m) => ({
                  value: m.modelId,
                  label: m.displayName || m.modelId,
                }))}
              className="generate-model-select"
            />
            <Button
              type="primary"
              loading={generating}
              onClick={handleGenerate}
            >
              Сгенерировать тему
            </Button>
          </div>
        </div>
      </section>

      <section className="themes-section themes-list">
        <h2>
          <Palette size={20} />
          Доступные темы
          <span className="themes-list__count">
            {themesLoading ? "…" : themes.length}
          </span>
        </h2>

        <div className="themes-toolbar">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
            optionRender={renderTypeOption}
            dropdownClassName="type-filter-dropdown"
            className="filter-select type-filter"
          />
          <Input
            value={labelsFilter}
            onChange={(e) => setLabelsFilter(e.target.value)}
            placeholder="Метки через запятую: warm, neon"
            className="filter-labels"
          />
          {selectedThemeId && (
            <Button onClick={handleReset}>Сбросить текущую тему</Button>
          )}
        </div>

        {allLabels.length > 0 && (
          <div className="themes-categories">
            <span className="categories-label">Метки:</span>
            {allLabels.map((label) => (
              <Tag
                key={label}
                className="category-tag"
                onClick={() =>
                  setLabelsFilter((prev) => (prev ? `${prev},${label}` : label))
                }
              >
                {label}
              </Tag>
            ))}
          </div>
        )}

        {themesLoading ? (
          <div className="themes-loading">Загрузка тем…</div>
        ) : themes.length === 0 ? (
          <div className="themes-empty">Нет тем по выбранным фильтрам</div>
        ) : (
          <div className="themes-grid">
            {themes.map((theme, index) => {
              const id = themeId(theme);
              const isSelected = selectedThemeId === id;
              return (
                <div
                  key={id}
                  className={`theme-card ${isSelected ? "theme-card--selected" : ""}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                  onClick={() => navigate(`/system/themes/${id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && navigate(`/system/themes/${id}`)
                  }
                >
                  <div
                    className="theme-preview"
                    style={{
                      backgroundColor:
                        theme.colors?.["button-primary-bg"] ??
                        "var(--card-background)",
                    }}
                  />
                  <div className="theme-info">
                    <div className="theme-name">{theme.name}</div>
                    {theme.description && (
                      <div className="theme-desc">{theme.description}</div>
                    )}
                    <div className="theme-meta">
                      <Tag className={`theme-type type-${theme.type}`}>
                        {theme.type === "light"
                          ? "Светлая"
                          : theme.type === "dark"
                            ? "Тёмная"
                            : "Пользовательская"}
                      </Tag>
                      {(theme.labels || []).map((l) => (
                        <Tag key={l} className="theme-label">
                          {l}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    className={`theme-apply-btn ${isSelected ? "theme-apply-btn--selected" : ""}`}
                    disabled={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(theme);
                    }}
                  >
                    {isSelected ? (
                      <span className="theme-apply-btn__label">
                        Выбрана
                        <Check size={14} className="theme-apply-btn__check" />
                      </span>
                    ) : (
                      "Применить"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
