import React, { useMemo } from "react";
import { Select } from "antd";
import type { ModelOption } from "../../types/llmModel";
import "./ModelSelect.scss";

const GROUP_LAST_USED = "last_used";
const GROUP_OPENROUTER = "openrouter";
const GROUP_HUGGINGFACE = "huggingface";
const GROUP_OTHER = "other";

const LABELS: Record<string, string> = {
  [GROUP_LAST_USED]: "Последняя использованная",
  [GROUP_OPENROUTER]: "OpenRouter",
  [GROUP_HUGGINGFACE]: "Hugging Face",
  [GROUP_OTHER]: "Прочее",
};

function getGroup(model: ModelOption): string {
  if (model.lastUsedAt) return GROUP_LAST_USED;
  const agg = (model.aggregator || "").toLowerCase();
  if (agg === "openrouter") return GROUP_OPENROUTER;
  if (agg === "huggingface") return GROUP_HUGGINGFACE;
  return GROUP_OTHER;
}

function renderOptionLabel(m: ModelOption) {
  const name = m.displayName || m.modelId;
  const aggregator = m.aggregator || "";
  const contextLength = m.contextLength != null ? m.contextLength : null;
  const parts = [aggregator].filter(Boolean);
  if (contextLength != null) parts.push(`${contextLength}`);
  const subtitle = parts.length > 0 ? parts.join(" • ") : null;

  return (
    <div className="model-select-option">
      <span className="model-select-option__name">{name}</span>
      {subtitle && (
        <span className="model-select-option__meta">{subtitle}</span>
      )}
    </div>
  );
}

export interface ModelSelectProps {
  models: ModelOption[];
  value?: string | null;
  onChange: (modelId: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  showSearch?: boolean;
  loading?: boolean;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  className?: string;
  /** Опция "Авто" / пустое значение в начале (для чата) */
  allowAuto?: boolean;
  filterActive?: boolean;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({
  models,
  value,
  onChange,
  placeholder = "Выберите модель",
  allowClear = true,
  showSearch = true,
  loading = false,
  disabled = false,
  size = "middle",
  className,
  allowAuto = false,
  filterActive = true,
}) => {
  const groupedOptions = useMemo(() => {
    const list = filterActive
      ? models.filter((m) => m.isActive !== false)
      : models;

    const withGroup = list.map((m) => ({ model: m, group: getGroup(m) }));
    const lastUsed = withGroup
      .filter((x) => x.group === GROUP_LAST_USED)
      .sort(
        (a, b) =>
          new Date(b.model.lastUsedAt!).getTime() -
          new Date(a.model.lastUsedAt!).getTime(),
      )
      .map((x) => x.model);
    const openrouter = withGroup
      .filter((x) => x.group === GROUP_OPENROUTER)
      .map((x) => x.model);
    const huggingface = withGroup
      .filter((x) => x.group === GROUP_HUGGINGFACE)
      .map((x) => x.model);
    const other = withGroup
      .filter((x) => x.group === GROUP_OTHER)
      .map((x) => x.model);

    const groups: {
      label: string;
      options: { value: string; label: React.ReactNode }[];
    }[] = [];

    if (allowAuto) {
      groups.push({
        label: "",
        options: [{ value: "", label: "Авто" }],
      });
    }

    const pushGroup = (labelKey: string, items: ModelOption[]) => {
      if (items.length === 0) return;
      groups.push({
        label: LABELS[labelKey] || labelKey,
        options: items.map((m) => ({
          value: m.modelId,
          label: renderOptionLabel(m),
        })),
      });
    };

    pushGroup(GROUP_LAST_USED, lastUsed);
    pushGroup(GROUP_OPENROUTER, openrouter);
    pushGroup(GROUP_HUGGINGFACE, huggingface);
    pushGroup(GROUP_OTHER, other);

    return groups;
  }, [models, filterActive, allowAuto]);

  const modelById = useMemo(() => {
    const map = new Map<string, ModelOption>();
    models.forEach((m) => map.set(m.modelId, m));
    return map;
  }, [models]);

  const optionFilterOption = (
    input: string,
    option?: { value?: string } | undefined,
  ) => {
    if (!input.trim()) return true;
    if (!option) return true;
    const m = option.value ? modelById.get(option.value) : null;
    const search = input.toLowerCase();
    const id = (m?.modelId ?? option.value ?? "").toLowerCase();
    const name = (m?.displayName ?? "").toLowerCase();
    return id.includes(search) || name.includes(search);
  };

  return (
    <Select
      className={`model-select ${className ?? ""}`.trim()}
      value={value === undefined ? undefined : value}
      onChange={(v) =>
        onChange(v === null || v === undefined ? undefined : String(v))
      }
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      loading={loading}
      disabled={disabled}
      size={size}
      options={groupedOptions as any}
      filterOption={(input, option) =>
        optionFilterOption(input, option as { value?: string } | undefined)
      }
      optionRender={(option) => (
        <div className="model-select-option-wrap">
          {(option.data as { label?: React.ReactNode })?.label}
        </div>
      )}
      popupClassName="model-select-dropdown"
    />
  );
};
