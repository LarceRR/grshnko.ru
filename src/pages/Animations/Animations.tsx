import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Popconfirm } from "antd";
import { getDevices } from "../../api/devices";
import {
  getAnimations,
  createAnimation,
  sendAnimationToDevice,
  deleteAnimation,
} from "../../api/animations";
import type {
  AnimationCreated,
  AnimationListItem,
} from "../../types/animation";

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
  const [prompt, setPrompt] = useState("");
  const [ledCount, setLedCount] = useState(300);
  const [creating, setCreating] = useState(false);
  const [sendModal, setSendModal] = useState<{
    anim: AnimationCreated | AnimationListItem;
  } | null>(null);
  const [sendingToDeviceId, setSendingToDeviceId] = useState<string | null>(
    null,
  );

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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await createAnimation({
        prompt: prompt.trim() || undefined,
        ledCount: ledCount || 300,
      });
      setPrompt("");
      await queryClient.invalidateQueries({ queryKey: ["animations"] });
      notify({
        title: "Анимация создана",
        body: `ID: ${created.id}. Сложность: ${created.animationHardness ?? "—"}`,
        type: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка создания анимации";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setCreating(false);
    }
  };

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
      </div>

      <section className="create-block">
        <h2 style={{ margin: "0 0 8px 0", fontSize: 16 }}>
          Создать анимацию (LLM)
        </h2>
        <div className="create-row">
          <div className="prompt-input">
            <textarea
              placeholder="Опишите анимацию, например: радужная волна с переходом в огонь"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>
          <div className="led-count-wrap">
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              LED
            </label>
            <input
              type="number"
              min={1}
              max={2000}
              value={ledCount}
              onChange={(e) => setLedCount(Number(e.target.value) || 300)}
            />
          </div>
          <button
            className="btn-create"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? "Создаём…" : "Создать анимацию"}
          </button>
        </div>
        <p className="create-hint">
          Промпт можно оставить пустым — тогда будет сгенерирована случайная
          анимация. Результат сохраняется в БД.
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
              <div key={anim.id} className="animation-item">
                <div className="anim-info">
                  <div className="anim-id">{anim.id}</div>
                  <div className="anim-meta">
                    Сложность: {anim.animationHardness ?? "—"} ·{" "}
                    {new Date(anim.createdAt).toLocaleString()}
                  </div>
                  {anim.labels?.length || anim.usedColors?.length ? (
                    <div className="anim-tags">
                      {anim.labels && anim.labels.length > 0 && (
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
                      )}
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
                    </div>
                  ) : null}
                </div>
                <div className="anim-actions">
                  <button
                    type="button"
                    className="btn-create"
                    onClick={() => openSendModal(anim)}
                  >
                    Отправить на устройство
                  </button>
                  <Popconfirm
                    title="Удалить анимацию?"
                    description="Удаление нельзя отменить."
                    onConfirm={() => handleDelete(anim.id)}
                    okText="Удалить"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                  >
                    <button type="button" className="btn-danger">
                      Удалить
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
