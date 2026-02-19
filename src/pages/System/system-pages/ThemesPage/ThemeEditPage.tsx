import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Switch, Spin, Popconfirm } from "antd";
import { getTheme, updateTheme, deleteTheme } from "../../../../api/themes";
import { useNotify } from "../../../../hooks/useNotify";
import type { Theme, UpdateThemeBody } from "../../../../types/theme";
import { ArrowLeft, Copy } from "lucide-react";
import "./ThemeEditPage.scss";

const TYPE_OPTIONS = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "custom", label: "Пользовательская" },
];

export default function ThemeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Theme["type"]>("custom");
  const [labels, setLabels] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mainSectionRef = useRef<HTMLElement>(null);
  const colorsSectionRef = useRef<HTMLElement>(null);
  const [colorsMaxHeight, setColorsMaxHeight] = useState<number | undefined>(
    undefined,
  );

  const {
    data: theme,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["theme", id],
    queryFn: () => getTheme(id!),
    enabled: !!id,
  });

  useLayoutEffect(() => {
    if (!theme) return;
    const main = mainSectionRef.current;
    if (!main) return;
    const sync = () => setColorsMaxHeight(main.offsetHeight);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(main);
    return () => ro.disconnect();
  }, [theme, name, description, type, labels, isPublic]);

  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setDescription(theme.description ?? "");
      setType(theme.type);
      setLabels(theme.labels ?? []);
      setIsPublic(theme.isPublic ?? true);
      setColors(theme.colors ? { ...theme.colors } : {});
    }
  }, [theme]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const body: UpdateThemeBody = {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        type,
        labels,
        isPublic,
        colors,
      };
      await updateTheme(id, body);
      await queryClient.invalidateQueries({ queryKey: ["themes"] });
      await queryClient.invalidateQueries({ queryKey: ["theme", id] });
      notify({
        title: "Тема сохранена",
        body: "Изменения применены",
        type: "success",
      });
      navigate("/system/themes");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка сохранения";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteTheme(id);
      await queryClient.invalidateQueries({ queryKey: ["themes"] });
      notify({
        title: "Тема удалена",
        body: "Тема удалена из списка",
        type: "success",
      });
      navigate("/system/themes");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка удаления";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const setColor = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const copyHex = (value: string) => {
    const hex = (value ?? "").trim();
    if (!hex) return;
    navigator.clipboard.writeText(hex).then(
      () => notify({ title: "Скопировано", body: hex, type: "success" }),
      () =>
        notify({
          title: "Ошибка копирования",
          body: "Не удалось скопировать в буфер",
          type: "error",
        }),
    );
  };

  if (!id) {
    navigate("/system/themes");
    return null;
  }

  if (isLoading || !theme) {
    return (
      <div className="theme-edit-page">
        {contextHolder}
        <div className="theme-edit-page__loading">
          <Spin size="large" />
          <span>Загрузка темы…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    const message =
      (error as { response?: { status?: number } })?.response?.status === 404
        ? "Тема не найдена"
        : ((error as Error)?.message ?? "Ошибка загрузки");
    return (
      <div className="theme-edit-page">
        {contextHolder}
        <div className="theme-edit-page__error">
          <p>{message}</p>
          <Button onClick={() => navigate("/system/themes")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const colorKeys = Object.keys(colors).sort();

  return (
    <div className="theme-edit-page">
      {contextHolder}
      <header className="theme-edit-page__header">
        <button
          type="button"
          className="theme-edit-page__back"
          onClick={() => navigate("/system/themes")}
        >
          <ArrowLeft size={20} />
          <span>К списку тем</span>
        </button>
        <h1 className="theme-edit-page__title">Редактирование темы</h1>
      </header>

      <div className="theme-edit-page__form">
        <div className="theme-edit-page__columns">
          <section
            ref={mainSectionRef}
            className="theme-edit-section theme-edit-section--main"
          >
            <h2>Основное</h2>
            <div className="form-row">
              <label>Название</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название темы"
              />
            </div>
            <div className="form-row">
              <label>Описание</label>
              <Input.TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                rows={2}
              />
            </div>
            <div className="form-row">
              <label>Тип</label>
              <Select
                value={type}
                onChange={setType}
                options={TYPE_OPTIONS}
                className="form-select"
              />
            </div>
            <div className="form-row">
              <label>Метки</label>
              <Select
                mode="tags"
                value={labels}
                onChange={setLabels}
                placeholder="Введите метку и Enter"
                className="form-select form-select--full"
              />
            </div>
            <div className="form-row form-row--switch">
              <label>Публичная</label>
              <Switch checked={isPublic} onChange={setIsPublic} />
            </div>
          </section>

          <section
            ref={colorsSectionRef}
            className="theme-edit-section theme-edit-section--colors"
            style={
              colorsMaxHeight != null
                ? { maxHeight: colorsMaxHeight }
                : undefined
            }
          >
            <h2>Цвета (CSS-переменные)</h2>
            <div className="colors-grid">
              {colorKeys.map((key) => (
                <div key={key} className="color-row">
                  <div className="color-row__input-wrap" title={key}>
                    <span className="color-row__key">{key}</span>
                    <Input
                      value={colors[key] ?? ""}
                      onChange={(e) => setColor(key, e.target.value)}
                      placeholder="#000000"
                      className="color-row__input"
                      maxLength={9}
                    />
                    <button
                      type="button"
                      className="color-row__copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyHex(colors[key] ?? "");
                      }}
                      title="Копировать HEX"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <input
                    type="color"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(colors[key] ?? "")
                        ? colors[key]
                        : "#000000"
                    }
                    onChange={(e) => setColor(key, e.target.value)}
                    className="color-row__picker"
                    title="Выбор цвета"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="theme-edit-page__actions">
          <Button onClick={() => navigate("/system/themes")}>Отмена</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Сохранить
          </Button>
          <Popconfirm
            title="Удалить тему?"
            description="Все пользователи, выбравшие эту тему, вернутся к теме по умолчанию."
            onConfirm={handleDelete}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={deleting}>
              Удалить тему
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
