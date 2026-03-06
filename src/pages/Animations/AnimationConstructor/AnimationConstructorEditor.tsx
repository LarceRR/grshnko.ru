import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAnimationDetail,
  compileAnimation,
  createAnimationFromConstructor,
  updateAnimationFromConstructor,
} from "../../../api/animations";
import { useNotify } from "../../../hooks/useNotify";
import AnimationSimulator from "../../../components/AnimationSimulator/AnimationSimulator";
import type { AnimationDefinition, AnimationLayer } from "../../../types/animation";
import type { AnimationDetail } from "../../../types/animation";
import {
  EMPTY_ANIMATION,
  LAST_EDITED_IDS_KEY,
  MAX_LAST_EDITED,
  PRESETS,
} from "./constants";
import ExpressionField from "./ExpressionField";
import ExpressionReference from "./ExpressionReference";
import { ArrowLeft, Save } from "lucide-react";
import "./AnimationConstructorEditor.scss";

export default function AnimationConstructorEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify, contextHolder } = useNotify();
  const queryClient = useQueryClient();

  const isNew = id === "new";
  const [definition, setDefinition] = useState<AnimationDefinition | null>(
    null
  );
  const [compiledBody, setCompiledBody] = useState<AnimationDetail["body"] | null>(
    null
  );
  const [compileError, setCompileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);

  const { data: existingAnimation, isLoading } = useQuery({
    queryKey: ["animation-detail", id],
    queryFn: () => getAnimationDetail(id!),
    enabled: !!id && !isNew,
    retry: false,
  });

  useEffect(() => {
    if (isNew) {
      setDefinition({ ...EMPTY_ANIMATION });
      return;
    }
    if (existingAnimation?.sourceJson) {
      try {
        const parsed = JSON.parse(existingAnimation.sourceJson) as AnimationDefinition;
        setDefinition(parsed);
      } catch {
        setDefinition({ ...EMPTY_ANIMATION });
      }
    } else if (existingAnimation) {
      setDefinition({ ...EMPTY_ANIMATION });
    }
  }, [isNew, existingAnimation]);

  const doCompile = useCallback(async (def: AnimationDefinition) => {
    setCompileError(null);
    try {
      const res = await compileAnimation(def);
      if (res.ok && res.body) {
        setCompiledBody(res.body);
        return res.body;
      }
      setCompileError(res.error ?? "Ошибка компиляции");
      setCompiledBody(null);
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка компиляции";
      setCompileError(msg);
      setCompiledBody(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!definition) return;
    const t = setTimeout(() => {
      doCompile(definition);
    }, 400);
    return () => clearTimeout(t);
  }, [definition, doCompile]);

  const handleSave = async () => {
    if (!definition) return;
    setCompileError(null);
    const body = await doCompile(definition);
    if (!body) {
      notify({
        title: "Ошибка компиляции",
        body: compileError ?? "Не удалось скомпилировать",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await createAnimationFromConstructor({
          animation: definition,
        });
        notify({ title: "Анимация создана", body: created.id, type: "success" });
        addToLastEdited(created.id);
        navigate(`/animations/constructor/${created.id}`);
        await queryClient.invalidateQueries({ queryKey: ["animations"] });
      } else {
        await updateAnimationFromConstructor(id!, { animation: definition });
        notify({ title: "Сохранено", body: "", type: "success" });
        addToLastEdited(id!);
        await queryClient.invalidateQueries({ queryKey: ["animation-detail", id] });
        await queryClient.invalidateQueries({ queryKey: ["animations"] });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка сохранения";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const addToLastEdited = (animId: string) => {
    try {
      const raw = localStorage.getItem(LAST_EDITED_IDS_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const filtered = arr.filter((x) => x !== animId);
      filtered.unshift(animId);
      localStorage.setItem(
        LAST_EDITED_IDS_KEY,
        JSON.stringify(filtered.slice(0, MAX_LAST_EDITED))
      );
    } catch {}
  };

  const updateLayer = (index: number, patch: Partial<AnimationLayer>) => {
    if (!definition) return;
    const layers = [...definition.layers];
    layers[index] = { ...layers[index]!, ...patch };
    setDefinition({ ...definition, layers });
  };

  const addLayer = () => {
    if (!definition) return;
    if (definition.layers.length >= 6) {
      notify({ title: "Максимум 6 слоёв", body: "", type: "warning" });
      return;
    }
    const newLayer: AnimationLayer = {
      name: `layer_${definition.layers.length}`,
      selector: "1",
      color: { r: "255", g: "0", b: "0" },
      brightness: "1",
      opacity: "1",
      blend: "replace",
    };
    setDefinition({
      ...definition,
      layers: [...definition.layers, newLayer],
    });
    setSelectedLayerIndex(definition.layers.length);
  };

  const removeLayer = (index: number) => {
    if (!definition || definition.layers.length <= 1) return;
    const layers = definition.layers.filter((_, i) => i !== index);
    setDefinition({ ...definition, layers });
    setSelectedLayerIndex(Math.max(0, index - 1));
  };

  const updateParam = (name: string, value: number) => {
    if (!definition) return;
    setDefinition({
      ...definition,
      parameters: { ...definition.parameters, [name]: value },
    });
  };

  const addParam = (name: string, defaultValue: number) => {
    if (!definition) return;
    if (definition.parameters[name] !== undefined) return;
    setDefinition({
      ...definition,
      parameters: { ...definition.parameters, [name]: defaultValue },
    });
  };

  const removeParam = (name: string) => {
    if (!definition) return;
    const { [name]: _, ...rest } = definition.parameters;
    setDefinition({ ...definition, parameters: rest });
  };

  if (isLoading && !isNew) {
    return (
      <div className="constructor-editor">
        <div className="constructor-editor__loading">Загрузка…</div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="constructor-editor">
        <div className="constructor-editor__loading">Инициализация…</div>
      </div>
    );
  }

  const previewAnimation: AnimationDetail | null = compiledBody
    ? {
        id: id ?? "preview",
        body: compiledBody,
        createdAt: "",
        updatedAt: "",
      }
    : null;

  const selectedLayer = definition.layers[selectedLayerIndex];

  return (
    <div className="constructor-editor">
      {contextHolder}
      <header className="constructor-editor__header">
        <button
          type="button"
          className="constructor-editor__back"
          onClick={() => navigate("/animations/constructor")}
        >
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h1 className="constructor-editor__title">
          Конструктор: {definition.name || (isNew ? "Новая анимация" : id)}
        </h1>
        <div className="constructor-editor__actions">
          {compileError && (
            <span className="constructor-editor__error">{compileError}</span>
          )}
          <button
            type="button"
            className="constructor-editor__save"
            onClick={handleSave}
            disabled={saving || !!compileError}
          >
            <Save size={18} />
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </header>

      <div className="constructor-editor__body">
        <aside className="constructor-editor__sidebar">
          <section className="constructor-editor__section">
            <h3>Шаблон</h3>
            <select
              className="constructor-editor__preset-select"
              value=""
              onChange={(e) => {
                const name = e.target.value;
                if (name) {
                  const p = PRESETS.find((x) => x.name === name);
                  if (p) setDefinition(JSON.parse(JSON.stringify(p.def)));
                  e.target.value = "";
                }
              }}
            >
              <option value="">Выбрать шаблон...</option>
              {PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </section>

          <section className="constructor-editor__section">
            <h3>Слои</h3>
            <div className="constructor-editor__layers">
              {definition.layers.map((layer, idx) => (
                <div
                  key={idx}
                  className={`constructor-editor__layer-item ${
                    selectedLayerIndex === idx ? "selected" : ""
                  }`}
                  onClick={() => setSelectedLayerIndex(idx)}
                >
                  <span>{layer.name ?? `Слой ${idx}`}</span>
                  {definition.layers.length > 1 && (
                    <button
                      type="button"
                      className="constructor-editor__layer-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(idx);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {definition.layers.length < 6 && (
                <button
                  type="button"
                  className="constructor-editor__add-layer"
                  onClick={addLayer}
                >
                  + Добавить слой
                </button>
              )}
            </div>
          </section>

          <section className="constructor-editor__section">
            <h3>Параметры</h3>
            <div className="constructor-editor__params">
              {Object.entries(definition.parameters).map(([name, val]) => (
                <div key={name} className="constructor-editor__param-row">
                  <label>{name}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={val}
                    onChange={(e) =>
                      updateParam(name, parseFloat(e.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    className="constructor-editor__param-remove"
                    onClick={() => removeParam(name)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <AddParamForm onAdd={addParam} />
            </div>
          </section>

          <section className="constructor-editor__section">
            <h3>Настройки</h3>
            <div className="constructor-editor__meta">
              <div className="constructor-editor__meta-row">
                <label>Название</label>
                <input
                  type="text"
                  value={definition.name}
                  onChange={(e) =>
                    setDefinition({ ...definition, name: e.target.value })
                  }
                />
              </div>
              <div className="constructor-editor__meta-row">
                <label>LED</label>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={definition.ledCount}
                  onChange={(e) =>
                    setDefinition({
                      ...definition,
                      ledCount: Math.max(1, parseInt(e.target.value, 10) || 300),
                    })
                  }
                />
              </div>
              <div className="constructor-editor__meta-row">
                <label>FPS</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={definition.fps}
                  onChange={(e) =>
                    setDefinition({
                      ...definition,
                      fps: Math.max(1, parseInt(e.target.value, 10) || 30),
                    })
                  }
                />
              </div>
              <div className="constructor-editor__meta-row">
                <label>Яркость</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={definition.brightness}
                  onChange={(e) =>
                    setDefinition({
                      ...definition,
                      brightness: Math.max(
                        0,
                        Math.min(255, parseInt(e.target.value, 10) || 200)
                      ),
                    })
                  }
                />
              </div>
            </div>
          </section>
        </aside>

        <main className="constructor-editor__main">
          <div className="constructor-editor__preview">
            <AnimationSimulator animation={previewAnimation} autoPlay />
          </div>

          {selectedLayer && (
            <div className="constructor-editor__layer-form">
              <h3>Слой: {selectedLayer.name ?? `Слой ${selectedLayerIndex}`}</h3>
              <div className="constructor-editor__layer-fields">
                <div className="constructor-editor__field constructor-editor__field--full">
                  <ExpressionField
                    label="Selector"
                    value={selectedLayer.selector}
                    onChange={(v) => updateLayer(selectedLayerIndex, { selector: v })}
                    placeholder="1 = все пиксели"
                    hint="0 или 1. Где 1 — слой рисуется"
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <ExpressionField
                    label="Color R"
                    value={selectedLayer.color.r}
                    onChange={(v) =>
                      updateLayer(selectedLayerIndex, {
                        color: { ...selectedLayer.color, r: v },
                      })
                    }
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <ExpressionField
                    label="Color G"
                    value={selectedLayer.color.g}
                    onChange={(v) =>
                      updateLayer(selectedLayerIndex, {
                        color: { ...selectedLayer.color, g: v },
                      })
                    }
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <ExpressionField
                    label="Color B"
                    value={selectedLayer.color.b}
                    onChange={(v) =>
                      updateLayer(selectedLayerIndex, {
                        color: { ...selectedLayer.color, b: v },
                      })
                    }
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <ExpressionField
                    label="Brightness"
                    value={
                      selectedLayer.brightness !== undefined && selectedLayer.brightness !== null
                        ? String(selectedLayer.brightness)
                        : ""
                    }
                    onChange={(v) => updateLayer(selectedLayerIndex, { brightness: v })}
                    placeholder="1"
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <ExpressionField
                    label="Opacity"
                    value={
                      selectedLayer.opacity !== undefined && selectedLayer.opacity !== null
                        ? String(selectedLayer.opacity)
                        : ""
                    }
                    onChange={(v) => updateLayer(selectedLayerIndex, { opacity: v })}
                    placeholder="1"
                    quickInserts
                  />
                </div>
                <div className="constructor-editor__field">
                  <label>Blend</label>
                  <select
                    value={selectedLayer.blend ?? "replace"}
                    onChange={(e) =>
                      updateLayer(selectedLayerIndex, {
                        blend: e.target.value as AnimationLayer["blend"],
                      })
                    }
                    className="constructor-editor__select"
                  >
                    <option value="replace">replace</option>
                    <option value="add">add</option>
                    <option value="multiply">multiply</option>
                    <option value="screen">screen</option>
                    <option value="overlay">overlay</option>
                    <option value="lighten">lighten</option>
                  </select>
                </div>
              </div>

              <ExpressionReference
                onInsertSelector={(text) =>
                  updateLayer(selectedLayerIndex, { selector: text })
                }
                onInsertColor={(r, g, b) =>
                  updateLayer(selectedLayerIndex, {
                    color: { r, g, b },
                  })
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AddParamForm({
  onAdd,
}: {
  onAdd: (name: string, defaultValue: number) => void;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAdd(n, parseFloat(value) || 1);
    setName("");
    setValue("1");
  };

  return (
    <form className="constructor-editor__add-param" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Имя параметра"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        step="0.1"
        placeholder="Значение"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">+</button>
    </form>
  );
}
