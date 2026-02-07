import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Popconfirm } from "antd";
import { ArrowLeft } from "lucide-react";
import {
  getDevice,
  patchDevice,
  deleteDevice,
  getDeviceStatus,
  deviceRpc,
  getDeviceLogs,
  clearDeviceLogs,
} from "../../api/devices";
import { triggerOta } from "../../api/ota";
import type { DeviceWithLogs } from "../../types/device";
import { useNotify } from "../../hooks/useNotify";
import "./DeviceDetail.scss";

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const { data: device, isLoading } = useQuery<DeviceWithLogs>({
    queryKey: ["device", id],
    queryFn: () => getDevice(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["deviceLogs", id],
    queryFn: () => getDeviceLogs(id!, { limit: 50 }),
    enabled: !!id,
  });

  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [otaLoading, setOtaLoading] = useState(false);

  const openEdit = () => {
    if (device) {
      setEditName(device.name ?? "");
      setEditLocation(device.location ?? "");
      setEditModal(true);
    }
  };

  const saveEdit = async () => {
    if (!id) return;
    setSavingEdit(true);
    try {
      await patchDevice(id, {
        name: editName || undefined,
        location: editLocation,
      });
      await queryClient.invalidateQueries({ queryKey: ["device", id] });
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      setEditModal(false);
      notify({
        title: "Сохранено",
        body: "Метаданные обновлены",
        type: "success",
      });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Не удалось сохранить",
        type: "error",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!id) return;
    setRefreshingStatus(true);
    try {
      await getDeviceStatus(id);
      await queryClient.invalidateQueries({ queryKey: ["device", id] });
      notify({ title: "Статус обновлён", body: "", type: "success" });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body:
          err instanceof Error
            ? err.message
            : "Устройство не ответило (таймаут)",
        type: "error",
      });
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleRpc = async (
    method: string,
    params?: Record<string, unknown>,
  ) => {
    if (!id) return;
    try {
      await deviceRpc(id, method, params);
      await queryClient.invalidateQueries({ queryKey: ["device", id] });
      notify({ title: "Команда отправлена", body: method, type: "success" });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Устройство не ответило",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDevice(id);
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      notify({ title: "Устройство удалено", body: "", type: "success" });
      navigate("/devices");
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Не удалось удалить",
        type: "error",
      });
    }
  };

  const handleClearLogs = async () => {
    if (!id) return;
    setClearingLogs(true);
    try {
      const res = await clearDeviceLogs(id);
      await refetchLogs();
      await queryClient.invalidateQueries({ queryKey: ["device", id] });
      notify({
        title: "Логи очищены",
        body: `Удалено записей: ${res.deleted}`,
        type: "success",
      });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Не удалось очистить",
        type: "error",
      });
    } finally {
      setClearingLogs(false);
    }
  };

  const handleOta = async () => {
    if (!id) return;
    setOtaLoading(true);
    try {
      await triggerOta(id);
      notify({
        title: "OTA отправлена",
        body: "Устройство перезагрузится после обновления",
        type: "success",
      });
    } catch (err: unknown) {
      notify({
        title: "Ошибка OTA",
        body: err instanceof Error ? err.message : "Не удалось запустить OTA",
        type: "error",
      });
    } finally {
      setOtaLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="device-detail-page">
        <p>Нет id устройства.</p>
        <Link to="/devices">К списку устройств</Link>
      </div>
    );
  }

  if (isLoading || !device) {
    return (
      <div className="device-detail-page">
        <div className="detail-header">
          <Link to="/devices" className="back-link">
            <ArrowLeft size={18} /> К списку
          </Link>
        </div>
        <p>Загрузка…</p>
      </div>
    );
  }

  const infoRows: { label: string; value: string | number | undefined }[] = [
    { label: "Device ID", value: device.deviceId },
    { label: "Имя", value: device.name },
    { label: "Локация", value: device.location },
    { label: "Статус", value: device.status },
    { label: "IP", value: device.ipAddress },
    { label: "LED", value: device.ledCount },
    { label: "Прошивка", value: device.firmwareVersion },
    {
      label: "Был онлайн",
      value: device.lastSeenAt
        ? new Date(device.lastSeenAt).toLocaleString()
        : undefined,
    },
    {
      label: "Playing",
      value: device.playing != null ? String(device.playing) : undefined,
    },
    { label: "Brightness", value: device.brightness },
    { label: "Current animation", value: device.currentAnimationId },
    { label: "Uptime (s)", value: device.uptime },
    { label: "Free heap", value: device.freeHeap },
    { label: "RSSI", value: device.rssi },
    { label: "MAC", value: device.macAddress },
    { label: "Chip", value: device.chipModel },
    { label: "CPU MHz", value: device.cpuFreqMHz },
    { label: "SDK", value: device.sdkVersion },
    { label: "Last reset", value: device.lastResetReason },
    { label: "Boot count", value: device.bootCount },
  ];

  const displayLogs = logs.length > 0 ? logs : (device.logs ?? []);

  return (
    <div className="device-detail-page">
      {contextHolder}
      <div className="detail-header">
        <Link to="/devices" className="back-link">
          <ArrowLeft size={18} /> К списку
        </Link>
        <h1>{device.name || device.deviceId}</h1>
        <span className={`status-badge ${device.status}`}>{device.status}</span>
      </div>

      <div className="detail-sections">
        <section className="detail-section">
          <h2>Информация</h2>
          <div className="info-grid">
            {infoRows
              .filter((r) => r.value !== undefined && r.value !== "")
              .map((r) => (
                <div key={r.label} className="info-item">
                  <span className="info-label">{r.label}</span>
                  <span className="info-value">{String(r.value)}</span>
                </div>
              ))}
          </div>
          <div className="actions-row">
            <button type="button" onClick={openEdit}>
              Редактировать имя и локацию
            </button>
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={refreshingStatus}
            >
              {refreshingStatus ? "Запрос…" : "Запросить статус"}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleRpc("play")}
            >
              Play
            </button>
            <button type="button" onClick={() => handleRpc("pause")}>
              Pause
            </button>
            <button type="button" onClick={() => handleRpc("reboot")}>
              Reboot
            </button>
            <button
              type="button"
              onClick={() => handleRpc("set_brightness", { brightness: 200 })}
            >
              Brightness 200
            </button>
            <button type="button" onClick={handleOta} disabled={otaLoading}>
              {otaLoading ? "OTA…" : "OTA обновление"}
            </button>
            <Popconfirm
              title="Удалить устройство?"
              description="Все логи будут удалены."
              onConfirm={handleDelete}
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
            >
              <button type="button" className="btn-danger">
                Удалить устройство
              </button>
            </Popconfirm>
          </div>
        </section>

        <section className="detail-section logs-section">
          <h2>Логи</h2>
          <div className="logs-toolbar">
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Последние записи
            </span>
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={clearingLogs}
              className="btn-danger"
            >
              {clearingLogs ? "…" : "Очистить логи"}
            </button>
          </div>
          {displayLogs.length === 0 ? (
            <div className="logs-empty">Нет записей</div>
          ) : (
            <div className="logs-list">
              {displayLogs.map((log) => (
                <div key={log.id} className="log-row">
                  <span className={`log-severity ${log.severity}`}>
                    {log.severity}
                  </span>
                  <span className="log-message">
                    [{log.code}] {log.message}
                  </span>
                  <span className="log-time">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={saveEdit}
        title="Редактировать устройство"
        confirmLoading={savingEdit}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        styles={{ content: { background: "var(--card-background)" } }}
      >
        <div className="edit-form">
          <label>Имя</label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Название устройства"
          />
          <label>Локация</label>
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="home, bedroom, ..."
          />
        </div>
      </Modal>
    </div>
  );
}
