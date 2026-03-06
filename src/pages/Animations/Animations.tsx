import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Popconfirm } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getDevices } from "../../api/devices";
import {
  getAnimations,
  createAnimation,
  enhancePrompt as enhancePromptApi,
  sendAnimationToDevice,
  deleteAnimation,
} from "../../api/animations";
import { getUser } from "../../api/user";
import { getLLMModels } from "../../api/llmModels";
import { ModelSelect } from "../../components/ModelSelect/ModelSelect";
import type {
  AnimationCreated,
  AnimationListItem,
} from "../../types/animation";
import type { LLMModel } from "../../types/llmModel";
import { Send, Trash2, Wand2, Square, Wrench } from "lucide-react";

/** Палитра фонов для лейблов (разные цвета) */
const LABEL_BG_COLORS = [
  "rgba(47, 119, 200, 0.35)",
  "rgba(46, 160, 67, 0.35)",
  "rgba(207, 34, 46, 0.25)",
  "rgba(209, 134, 22, 0.35)",
  "rgba(130, 80, 223, 0.35)",
  "rgba(255, 211, 61, 0.4)",
  "rgba(0, 180, 180, 0.35)",
  "rgba(230, 100, 140, 0.35)",
];
import type { Device } from "../../types/device";
import { useNotify } from "../../hooks/useNotify";
import "./Animations.scss";

export default function Animations() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [ledCount, setLedCount] = useState(300);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    undefined,
  );
  const [creating, setCreating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [sendModal, setSendModal] = useState<{
    anim: AnimationCreated | AnimationListItem;
  } | null>(null);
  const [sendingToDeviceId, setSendingToDeviceId] = useState<string | null>(
    null,
  );

  // Abort controllers for cancelling in-flight LLM requests
  const enhanceAbortRef = useRef<AbortController | null>(null);
  const createAbortRef = useRef<AbortController | null>(null);

  const { notify, contextHolder } = useNotify();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const { data: animations = [], isLoading: animationsLoading } = useQuery<
    AnimationListItem[]
  >({
    queryKey: ["animations"],
    queryFn: () => getAnimations({ skip: 0, take: 50 }),
    retry: false,
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });
  const canCreate = user?.permissions?.includes("ANIMATION_CREATE") ?? false;

  const { data: llmModels = [], isLoading: modelsLoading } = useQuery<
    LLMModel[]
  >({
    queryKey: ["llm-models"],
    queryFn: getLLMModels,
    retry: false,
  });

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      notify({
        title: "Ошибка",
        body: "Введите промпт для улучшения",
        type: "error",
      });
      return;
    }
    enhanceAbortRef.current?.abort();
    const ac = new AbortController();
    enhanceAbortRef.current = ac;
    setEnhancing(true);
    try {
      const enhanced = await enhancePromptApi(
        {
          prompt: prompt.trim(),
          ledCount: ledCount || 300,
          model: selectedModel,
        },
        ac.signal,
      );
      setEnhancedPrompt(enhanced);
      setShowEnhanced(true);
      notify({
        title: "Промпт улучшен",
        body: "Проверьте результат и нажмите «Создать из улучшенного»",
        type: "success",
      });
    } catch (e: unknown) {
      if (axios.isCancel(e)) return;
      const msg = e instanceof Error ? e.message : "Ошибка улучшения промпта";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setEnhancing(false);
      enhanceAbortRef.current = null;
    }
  };

  const handleCancelEnhance = useCallback(() => {
    enhanceAbortRef.current?.abort();
    enhanceAbortRef.current = null;
    setEnhancing(false);
    notify({
      title: "Отменено",
      body: "Улучшение промпта отменено",
      type: "success",
    });
  }, [notify]);

  const handleCreate = async (useEnhanced = false) => {
    const finalPrompt =
      useEnhanced && enhancedPrompt.trim()
        ? enhancedPrompt.trim()
        : prompt.trim() || undefined;
    createAbortRef.current?.abort();
    const ac = new AbortController();
    createAbortRef.current = ac;
    setCreating(true);
    try {
      const created = await createAnimation(
        {
          prompt: finalPrompt,
          ledCount: ledCount || 300,
          model: selectedModel,
        },
        ac.signal,
      );
      setPrompt("");
      setEnhancedPrompt("");
      setShowEnhanced(false);
      await queryClient.invalidateQueries({ queryKey: ["animations"] });
      notify({
        title: "Анимация создана",
        body: `ID: ${created.id}. Сложность: ${created.animationHardness ?? "—"}`,
        type: "success",
      });
    } catch (e: unknown) {
      if (axios.isCancel(e)) return;
      const msg = e instanceof Error ? e.message : "Ошибка создания анимации";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setCreating(false);
      createAbortRef.current = null;
    }
  };

  const handleCancelCreate = useCallback(() => {
    createAbortRef.current?.abort();
    createAbortRef.current = null;
    setCreating(false);
    notify({
      title: "Отменено",
      body: "Генерация анимации отменена",
      type: "success",
    });
  }, [notify]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAnimation(id);
      await queryClient.invalidateQueries({ queryKey: ["animations"] });
      notify({ title: "Анимация удалена", body: id, type: "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка удаления";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const openSendModal = (anim: AnimationCreated | AnimationListItem) =>
    setSendModal({ anim });
  const closeSendModal = () => {
    setSendModal(null);
    setSendingToDeviceId(null);
  };

  const handleSendToDevice = async (deviceId: string) => {
    if (!sendModal) return;
    setSendingToDeviceId(deviceId);
    try {
      await sendAnimationToDevice(sendModal.anim.id, { deviceId });
      notify({
        title: "Отправлено",
        body: `Анимация отправлена на устройство ${deviceId}`,
        type: "success",
      });
      closeSendModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setSendingToDeviceId(null);
    }
  };

  return (
    <div className="animations-page">
      {contextHolder}
      <div className="animations-header">
        <h1>Анимации</h1>
        {canCreate && (
          <button
            type="button"
            className="animations-constructor-btn"
            onClick={() => navigate("/animations/constructor")}
          >
            <Wrench size={18} />
            Конструктор
          </button>
        )}
      </div>

      <section className="create-block">
        <h2>Создать анимацию (LLM)</h2>
        <div className="create-row">
          <div className="prompt-input">
            <textarea
              placeholder="Опишите анимацию, например: радужная волна с переходом в огонь"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>
          <div className="create-controls">
            <div className="led-count-wrap">
              <label>LED</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={ledCount}
                onChange={(e) => setLedCount(Number(e.target.value) || 300)}
              />
            </div>
            <div className="model-select-wrap">
              <label>Модель</label>
              <ModelSelect
                models={llmModels}
                value={selectedModel ?? undefined}
                onChange={setSelectedModel}
                placeholder="Выберите модель (необязательно)"
                loading={modelsLoading}
                className="animations-model-select"
              />
            </div>
            <div className="create-buttons">
              <button
                className="btn-enhance"
                onClick={handleEnhancePrompt}
                disabled={enhancing || creating || !prompt.trim()}
                title="ИИ создаст подробный технический промпт из вашего описания"
              >
                <Wand2 size={16} />
                {enhancing ? "Улучшаем..." : "Улучшить промпт"}
              </button>
              <button
                className="btn-create"
                onClick={() => handleCreate(false)}
                disabled={creating || enhancing}
              >
                {creating ? "Создаём..." : "Создать напрямую"}
              </button>
              {(enhancing || creating) && (
                <button
                  className="btn-stop"
                  onClick={enhancing ? handleCancelEnhance : handleCancelCreate}
                  title="Остановить генерацию"
                >
                  <Square size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {showEnhanced && enhancedPrompt && (
          <div className="enhanced-prompt-block">
            <div className="enhanced-prompt-header">
              <h3>Улучшенный промпт</h3>
              <div className="enhanced-prompt-actions">
                <button
                  className="btn-create-enhanced"
                  onClick={() => handleCreate(true)}
                  disabled={creating || enhancing}
                >
                  {creating ? "Создаём..." : "Создать из улучшенного"}
                </button>
                {creating && (
                  <button
                    className="btn-stop"
                    onClick={handleCancelCreate}
                    title="Остановить генерацию"
                  >
                    <Square size={14} />
                  </button>
                )}
                <button
                  className="btn-close-enhanced"
                  onClick={() => setShowEnhanced(false)}
                  disabled={creating}
                >
                  Скрыть
                </button>
              </div>
            </div>
            <textarea
              className="enhanced-prompt-textarea"
              value={enhancedPrompt}
              onChange={(e) => setEnhancedPrompt(e.target.value)}
              rows={12}
            />
          </div>
        )}

        <p className="create-hint">
          Промпт можно оставить пустым — тогда будет сгенерирована случайная
          анимация. Кнопка «Улучшить промпт» создаст подробный технический
          промпт для лучшего результата.
        </p>
      </section>

      <section className="session-animations">
        <h2>Список анимаций из БД</h2>
        {animationsLoading ? (
          <div className="empty-session">Загрузка…</div>
        ) : animations.length === 0 ? (
          <div className="empty-session">
            Анимаций пока нет. Создайте анимацию выше — она сохранится в БД и
            появится здесь.
          </div>
        ) : (
          <div className="animations-list">
            {animations.map((anim) => (
              <div
                key={anim.id}
                className="animation-item"
                onClick={() => navigate(`/animation/${anim.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="anim-info">
                  <div className="anim-id">{anim.id}</div>
                  <div className="anim-meta">
                    Сложность: {anim.animationHardness ?? "—"} ·{" "}
                    {new Date(anim.createdAt).toLocaleString()}
                  </div>
                  {anim.labels && anim.labels.length > 0 && (
                    <div className="anim-tags">
                      <div className="anim-labels">
                        {anim.labels.map((label, i) => (
                          <span
                            key={label}
                            className="anim-label"
                            style={{
                              backgroundColor:
                                LABEL_BG_COLORS[i % LABEL_BG_COLORS.length],
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {anim.usedColors && anim.usedColors.length > 0 && (
                  <div
                    className="anim-colors"
                    title={anim.usedColors.join(", ")}
                  >
                    {anim.usedColors.map((hex) => (
                      <span
                        key={hex}
                        className="anim-color-dot"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                )}
                <div className="anim-actions">
                  <button
                    type="button"
                    className="action-button send-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSendModal(anim);
                    }}
                    title="Отправить на устройство"
                  >
                    <Send size={18} />
                  </button>
                  <Popconfirm
                    title="Удалить анимацию?"
                    description="Удаление нельзя отменить."
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(anim.id);
                    }}
                    okText="Удалить"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      type="button"
                      className="action-button delete-button"
                      onClick={(e) => e.stopPropagation()}
                      title="Удалить"
                    >
                      <Trash2 size={18} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="devices-block">
        <h2>Доступные устройства</h2>
        {devicesLoading ? (
          <div className="devices-empty">Загрузка…</div>
        ) : devices.length === 0 ? (
          <div className="devices-empty">Устройств пока нет</div>
        ) : (
          <div className="devices-grid">
            {devices.map((d) => (
              <a
                key={d.id}
                href={`/devices/${d.id}`}
                className="device-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="device-name">{d.name || d.deviceId}</span>
                <span className="device-id">{d.deviceId}</span>
                <span className={`device-status ${d.status}`}>{d.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!sendModal}
        onCancel={closeSendModal}
        title="Отправить анимацию на устройство"
        footer={null}
        destroyOnClose
        styles={{ content: { background: "var(--card-background)" } }}
      >
        {sendModal && (
          <div className="send-modal-content">
            <p style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
              Анимация: <code>{sendModal.anim.id}</code>
            </p>
            <div className="devices-grid">
              {devices.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="send-device-btn"
                  onClick={() => handleSendToDevice(d.deviceId)}
                  disabled={sendingToDeviceId === d.deviceId}
                >
                  <span className="send-device-btn__name">
                    {d.name || d.deviceId}
                  </span>
                  <span className="send-device-btn__id">{d.deviceId}</span>
                  <span className={`send-device-btn__status ${d.status}`}>
                    {d.status}
                  </span>
                  <span className="send-device-btn__action">
                    {sendingToDeviceId === d.deviceId
                      ? "Отправка…"
                      : "Отправить"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
