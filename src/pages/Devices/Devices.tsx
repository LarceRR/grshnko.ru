import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popconfirm } from "antd";
import { getDevices, deleteDevice, deviceRpc } from "../../api/devices";
import type { Device } from "../../types/device";
import { useNotify } from "../../hooks/useNotify";
import "./Devices.scss";

export default function Devices() {
  const navigate = useNavigate();
  const { notify, contextHolder } = useNotify();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const handleDelete = async (
    e: React.MouseEvent | undefined,
    id: string,
    deviceId: string,
  ) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await deleteDevice(id);
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      notify({ title: "Устройство удалено", body: deviceId, type: "success" });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Не удалось удалить",
        type: "error",
      });
    }
  };

  const handleRpc = async (
    e: React.MouseEvent,
    id: string,
    method: string,
    params?: Record<string, unknown>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deviceRpc(id, method, params);
      notify({ title: "Команда отправлена", body: method, type: "success" });
    } catch (err: unknown) {
      notify({
        title: "Ошибка",
        body: err instanceof Error ? err.message : "Устройство не ответило",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="devices-page">
        <div className="devices-loading">Загрузка устройств…</div>
      </div>
    );
  }

  return (
    <div className="devices-page">
      {contextHolder}
      <div className="devices-header">
        <h1>Устройства</h1>
      </div>

      {devices.length === 0 ? (
        <div className="devices-empty">Устройств пока нет</div>
      ) : (
        <div className="devices-grid">
          {devices.map((d) => (
            <div
              key={d.id}
              className="device-card"
              onClick={() => navigate(`/devices/${d.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && navigate(`/devices/${d.id}`)
              }
            >
              <div className="card-header">
                <span className="device-name">{d.name || d.deviceId}</span>
                <span className={`device-status-badge ${d.status}`}>
                  {d.status}
                </span>
              </div>
              <div className="device-meta">
                <div className="meta-row">
                  <span>ID</span>
                  <span>{d.deviceId}</span>
                </div>
                <div className="meta-row">
                  <span>Локация</span>
                  <span>{d.location}</span>
                </div>
                {d.ledCount != null && (
                  <div className="meta-row">
                    <span>LED</span>
                    <span>{d.ledCount}</span>
                  </div>
                )}
                {d.ipAddress && (
                  <div className="meta-row">
                    <span>IP</span>
                    <span>{d.ipAddress}</span>
                  </div>
                )}
                {d.lastSeenAt && (
                  <div className="meta-row">
                    <span>Был онлайн</span>
                    <span>{new Date(d.lastSeenAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div
                className="device-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => handleRpc(e, d.id, "play")}
                  title="Запустить"
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRpc(e, d.id, "pause")}
                  title="Пауза"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRpc(e, d.id, "status")}
                  title="Запросить статус"
                >
                  Status
                </button>
                <Popconfirm
                  title="Удалить устройство?"
                  description={`${d.name || d.deviceId}. Все логи тоже будут удалены.`}
                  onConfirm={(e) => handleDelete(e, d.id, d.deviceId)}
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Удалить
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
