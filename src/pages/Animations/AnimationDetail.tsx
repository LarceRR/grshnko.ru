import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Popconfirm } from "antd";
import {
  getAnimationDetail,
  deleteAnimation,
  sendAnimationToDevice,
  updateAnimationParameters,
} from "../../api/animations";
import { getUser } from "../../api/user";
import { getDevices } from "../../api/devices";
import { useNotify } from "../../hooks/useNotify";
import { ArrowLeft, Send, Trash2, Save, Wrench } from "lucide-react";
import type { Device } from "../../types/device";
import type { AnimationDetail, ParamDescription } from "../../types/animation";
import AnimationSimulator from "../../components/AnimationSimulator/AnimationSimulator";
import "./AnimationDetail.scss";

export default function AnimationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify, contextHolder } = useNotify();
  const queryClient = useQueryClient();
  const [sendModal, setSendModal] = useState(false);
  const [sendingToDeviceId, setSendingToDeviceId] = useState<string | null>(
    null,
  );
  const [updateParamsModal, setUpdateParamsModal] = useState(false);
  const [selectedDeviceForParams, setSelectedDeviceForParams] = useState<
    string | null
  >(null);
  const [updatingParams, setUpdatingParams] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });
  const canEdit = user?.permissions?.includes("ANIMATION_CREATE") ?? false;

  const {
    data: animation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["animation-detail", id],
    queryFn: () => getAnimationDetail(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const [bodyParams, setBodyParams] = useState<AnimationDetail["body"] | null>(
    null,
  );
  const [paramStringValues, setParamStringValues] = useState<
    Record<number, string>
  >({});

  // Инициализируем параметры при загрузке анимации
  useEffect(() => {
    if (animation?.body && !bodyParams) {
      setBodyParams({ ...animation.body });
      // Инициализируем строковые значения
      const stringValues: Record<number, string> = {};
      if (animation.body.paramDefaults) {
        animation.body.paramDefaults.forEach((val, idx) => {
          stringValues[idx] = val.toString().replace(".", ",");
        });
      }
      setParamStringValues(stringValues);
    }
  }, [animation, bodyParams]);

  const handleDelete = async () => {
    try {
      await deleteAnimation(id!);
      await queryClient.invalidateQueries({ queryKey: ["animations"] });
      notify({ title: "Анимация удалена", body: "", type: "success" });
      navigate("/animations");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка удаления";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const handleSendToDevice = async (deviceId: string) => {
    if (!id) return;
    setSendingToDeviceId(deviceId);
    try {
      await sendAnimationToDevice(id, { deviceId });
      notify({
        title: "Отправлено",
        body: `Анимация отправлена на устройство ${deviceId}`,
        type: "success",
      });
      setSendModal(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setSendingToDeviceId(null);
    }
  };

  const handleSaveParams = () => {
    if (!bodyParams?.paramNames || bodyParams.paramNames.length === 0) {
      notify({
        title: "Ошибка",
        body: "Нет параметров для отправки",
        type: "error",
      });
      return;
    }
    setUpdateParamsModal(true);
  };

  const handleUpdateParamsOnDevice = async () => {
    if (!id || !selectedDeviceForParams || !bodyParams?.paramNames) return;

    // Формируем объект параметров из текущих значений в правом блоке
    const parameters: Record<string, number> = {};
    bodyParams.paramNames.forEach((name, idx) => {
      parameters[name] = bodyParams.paramDefaults?.[idx] ?? 0;
    });

    setUpdatingParams(true);
    try {
      const response = await updateAnimationParameters(id, {
        deviceId: selectedDeviceForParams,
        parameters,
      });
      notify({
        title: "Параметры обновлены",
        body: `Метод: ${response.method === "websocket" ? "WebSocket" : "Очередь"}`,
        type: "success",
      });
      setUpdateParamsModal(false);
      setSelectedDeviceForParams(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Ошибка обновления параметров";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setUpdatingParams(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animation-detail-page">
        <div className="loading-state">Загрузка...</div>
      </div>
    );
  }

  if (isError || !animation || (animation as any).error) {
    return (
      <div className="animation-detail-page">
        <div className="error-state">
          {(animation as any)?.error || "Ошибка загрузки анимации"}
        </div>
      </div>
    );
  }

  const bodyJson = JSON.stringify(bodyParams || animation?.body || {}, null, 2);

  return (
    <div className="animation-detail-page">
      {contextHolder}
      <div className="animation-detail-header">
        <button
          className="back-button"
          onClick={() => navigate("/animations")}
          title="Назад к списку"
        >
          <ArrowLeft size={20} />
          Назад
        </button>
        <h1>Детали анимации</h1>
        <div className="header-actions">
          {canEdit && (
            <button
              className="action-btn"
              onClick={() => navigate(`/animations/constructor/${id}`)}
              title="Открыть в конструкторе"
            >
              <Wrench size={18} />
              Конструктор
            </button>
          )}
          <button
            className="action-btn send-btn"
            onClick={() => setSendModal(true)}
            title="Отправить на устройство"
          >
            <Send size={18} />
            Отправить
          </button>
          <Popconfirm
            title="Удалить анимацию?"
            description="Удаление нельзя отменить."
            onConfirm={handleDelete}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <button className="action-btn delete-btn" title="Удалить">
              <Trash2 size={18} />
              Удалить
            </button>
          </Popconfirm>
        </div>
      </div>

      <div className="animation-detail-content">
        <div className="main-info-grid">
          <div className="animation-info-section">
            <h2>Информация</h2>
            <div className="info-compact">
              <div className="info-row">
                <span className="info-label">ID:</span>
                <span className="info-value">{animation.id}</span>
              </div>
              {animation.schemaVersion && (
                <div className="info-row">
                  <span className="info-label">Версия:</span>
                  <span className="info-value">{animation.schemaVersion}</span>
                </div>
              )}
              {animation.animationHardness !== undefined && (
                <div className="info-row">
                  <span className="info-label">Сложность:</span>
                  <span className="info-value">
                    {animation.animationHardness}
                  </span>
                </div>
              )}
              {animation.labels && animation.labels.length > 0 && (
                <div className="info-row">
                  <span className="info-label">Метки:</span>
                  <div className="labels-list">
                    {animation.labels.map((label) => (
                      <span key={label} className="label-tag">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {animation.usedColors && animation.usedColors.length > 0 && (
                <div className="info-row">
                  <span className="info-label">Цвета:</span>
                  <div className="colors-list">
                    {animation.usedColors.map((hex) => (
                      <span
                        key={hex}
                        className="color-dot"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {animation.description && (
              <div className="animation-description">
                <h3>Описание</h3>
                <p>{animation.description}</p>
              </div>
            )}
            <div className="raw-json-inline">
              <h3>Raw Body (JSON)</h3>
              <textarea
                className="raw-body-textarea-inline"
                value={bodyJson}
                readOnly
                rows={12}
              />
            </div>
          </div>

          <div className="animation-params-section">
            <h2>Параметры</h2>
            {bodyParams && (
              <div className="params-form">
                {bodyParams.paramNames &&
                  bodyParams.paramNames.length > 0 &&
                  bodyParams.paramNames.map((name, idx) => {
                    const pd = animation.paramsDescription?.[name] as ParamDescription | undefined;
                    return (
                    <div key={idx} className="param-row">
                      <span className="param-name">{name}</span>
                      {pd && (
                        <span className="param-desc">{pd.description}</span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          paramStringValues[idx] ??
                          (bodyParams.paramDefaults?.[idx] ?? 0)
                            .toString()
                            .replace(".", ",")
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          // Сохраняем строковое значение как есть (с запятой)
                          setParamStringValues({
                            ...paramStringValues,
                            [idx]: value,
                          });

                          // Обновляем числовое значение
                          if (value === "" || value === "-") {
                            return;
                          }
                          const normalizedValue = value.replace(",", ".");
                          const numValue = parseFloat(normalizedValue);
                          if (
                            !isNaN(numValue) ||
                            value.endsWith(",") ||
                            value.endsWith(".")
                          ) {
                            const newDefaults = [
                              ...(bodyParams.paramDefaults || []),
                            ];
                            newDefaults[idx] = isNaN(numValue) ? 0 : numValue;
                            setBodyParams({
                              ...bodyParams,
                              paramDefaults: newDefaults,
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                            const currentValue =
                              bodyParams.paramDefaults?.[idx] ?? 0;
                            let step = 1;

                            if (e.ctrlKey && e.shiftKey) {
                              step = 0.1; // Ctrl + Shift: ±0.1
                            } else if (e.shiftKey) {
                              step = 10; // Shift: ±10
                            } else if (e.ctrlKey) {
                              step = 100; // Ctrl: ±100
                            }

                            const newValue =
                              e.key === "ArrowUp"
                                ? currentValue + step
                                : currentValue - step;

                            const newDefaults = [
                              ...(bodyParams.paramDefaults || []),
                            ];
                            newDefaults[idx] = newValue;
                            setBodyParams({
                              ...bodyParams,
                              paramDefaults: newDefaults,
                            });

                            // Обновляем строковое значение
                            setParamStringValues({
                              ...paramStringValues,
                              [idx]: newValue.toString().replace(".", ","),
                            });
                          }
                        }}
                        onBlur={(e) => {
                          // При потере фокуса нормализуем значение
                          const value = e.target.value.replace(",", ".");
                          const numValue = parseFloat(value);
                          if (
                            isNaN(numValue) ||
                            value === "" ||
                            value === "-" ||
                            value === "."
                          ) {
                            const newDefaults = [
                              ...(bodyParams.paramDefaults || []),
                            ];
                            newDefaults[idx] = 0;
                            setBodyParams({
                              ...bodyParams,
                              paramDefaults: newDefaults,
                            });
                            setParamStringValues({
                              ...paramStringValues,
                              [idx]: "0",
                            });
                          } else {
                            const newDefaults = [
                              ...(bodyParams.paramDefaults || []),
                            ];
                            newDefaults[idx] = numValue;
                            setBodyParams({
                              ...bodyParams,
                              paramDefaults: newDefaults,
                            });
                            setParamStringValues({
                              ...paramStringValues,
                              [idx]: numValue.toString().replace(".", ","),
                            });
                          }
                        }}
                        className="param-value-input"
                      />
                      {pd && (
                        <div className="param-effects">
                          <span className="param-effect up" title="При увеличении">{pd.increaseEffect}</span>
                          <span className="param-effect down" title="При уменьшении">{pd.decreaseEffect}</span>
                        </div>
                      )}
                    </div>
                    );
                  })}
                {bodyParams.paramNames && bodyParams.paramNames.length > 0 && (
                  <button className="save-btn" onClick={handleSaveParams}>
                    <Save size={16} />
                    Сохранить изменения
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="simulator-section">
          <AnimationSimulator
            animation={
              bodyParams ? { ...animation, body: bodyParams } : animation
            }
          />
        </div>
      </div>

      <Modal
        open={sendModal}
        onCancel={() => setSendModal(false)}
        title="Отправить анимацию на устройство"
        footer={null}
        destroyOnClose
        wrapClassName="animation-detail-modal"
        styles={{ content: { background: "var(--card-background)" } }}
      >
        <div className="send-modal-content">
          <p style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
            Анимация: <code>{animation?.id}</code>
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
                  {sendingToDeviceId === d.deviceId ? "Отправка…" : "Отправить"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={updateParamsModal}
        onCancel={() => {
          setUpdateParamsModal(false);
          setSelectedDeviceForParams(null);
        }}
        title="Обновить параметры на устройстве"
        footer={null}
        destroyOnClose
        width={600}
        wrapClassName="animation-detail-modal"
        styles={{ content: { background: "var(--card-background)" } }}
      >
        <div className="update-params-modal-content">
          <p style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
            Анимация: <code>{animation?.id}</code>
          </p>
          <div className="devices-grid">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`send-device-btn ${
                  selectedDeviceForParams === d.deviceId ? "selected" : ""
                }`}
                onClick={() => {
                  if (selectedDeviceForParams === d.deviceId) {
                    handleUpdateParamsOnDevice();
                  } else {
                    setSelectedDeviceForParams(d.deviceId);
                  }
                }}
                disabled={updatingParams}
              >
                <span className="send-device-btn__name">
                  {d.name || d.deviceId}
                </span>
                <span className="send-device-btn__id">{d.deviceId}</span>
                <span className={`send-device-btn__status ${d.status}`}>
                  {d.status}
                </span>
                <span className="send-device-btn__action">
                  {selectedDeviceForParams === d.deviceId
                    ? updatingParams
                      ? "Обновление…"
                      : "Обновить параметры"
                    : "Выбрать"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
