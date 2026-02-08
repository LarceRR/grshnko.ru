import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  uploadOtaFirmware,
  uploadOtaAsCurrent,
  getOtaList,
  triggerOta,
  triggerOtaAll,
} from "../../api/ota";
import type { OtaFirmwareItem } from "../../api/ota";
import { getDevices } from "../../api/devices";
import { useNotify } from "../../hooks/useNotify";
import "./Ota.scss";

const ACCEPT = ".bin";

type UploadMode = "versioned" | "current";

export default function Ota() {
  const [uploadMode, setUploadMode] = useState<UploadMode>("versioned");
  const [version, setVersion] = useState("1.0.0");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [triggeringAll, setTriggeringAll] = useState(false);

  const { notify, contextHolder } = useNotify();
  const queryClient = useQueryClient();

  const { data: firmwares = [], isLoading: listLoading } = useQuery<
    OtaFirmwareItem[]
  >({
    queryKey: ["otaList"],
    queryFn: getOtaList,
    retry: false,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(".bin")) return "Только файлы .bin";
    const max = 4 * 1024 * 1024;
    if (file.size > max) return "Максимум 4 МБ";
    return null;
  };

  const doUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setDropError(null);
      try {
        if (uploadMode === "current") {
          await uploadOtaAsCurrent(file);
          notify({
            title: "Прошивка загружена",
            body: "Сохранена как текущая (firmware.bin)",
            type: "success",
          });
        } else {
          await uploadOtaFirmware(file, version || undefined);
          notify({
            title: "Прошивка загружена",
            body: `Версия: ${version || "0.0.0"}`,
            type: "success",
          });
        }
        await queryClient.invalidateQueries({ queryKey: ["otaList"] });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки";
        notify({ title: "Ошибка", body: msg, type: "error" });
        setDropError(msg);
      } finally {
        setUploading(false);
      }
    },
    [uploadMode, version, notify, queryClient],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setDropError(err);
        notify({ title: "Ошибка", body: err, type: "error" });
        return;
      }
      doUpload(file);
      e.target.value = "";
    },
    [doUpload, notify],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setDropError(err);
        notify({ title: "Ошибка", body: err, type: "error" });
        return;
      }
      doUpload(file);
    },
    [doUpload, notify],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setDropError(null);
  }, []);

  const handleTriggerAll = async () => {
    setTriggeringAll(true);
    try {
      const res = await triggerOtaAll();
      notify({
        title: "OTA запущена",
        body: `Отправлено на ${res.triggered} устройств, пропущено: ${res.skipped}`,
        type: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка OTA";
      notify({ title: "Ошибка", body: msg, type: "error" });
    } finally {
      setTriggeringAll(false);
    }
  };

  const handleTriggerDevice = async (deviceId: string, firmware?: string) => {
    try {
      await triggerOta(deviceId, firmware);
      notify({
        title: "OTA отправлена",
        body: `Устройство ${deviceId}`,
        type: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Устройство не ответило";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="ota-page">
      {contextHolder}
      <h1>OTA — прошивки</h1>

      <section className="ota-upload-section">
        <h2>Загрузить прошивку</h2>
        <div className="upload-mode-tabs">
          <button
            type="button"
            className={uploadMode === "versioned" ? "active" : ""}
            onClick={() => setUploadMode("versioned")}
          >
            С версией (уникальное имя)
          </button>
          <button
            type="button"
            className={uploadMode === "current" ? "active" : ""}
            onClick={() => setUploadMode("current")}
          >
            Как текущая (firmware.bin)
          </button>
        </div>
        {uploadMode === "versioned" && (
          <div className="version-input-row">
            <label>Версия (например 1.2.3)</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="0.0.0"
            />
          </div>
        )}
        <div
          className={`drop-zone ${dragOver ? "dragover" : ""} ${dropError ? "error" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => document.getElementById("ota-file-input")?.click()}
        >
          <input
            id="ota-file-input"
            type="file"
            accept={ACCEPT}
            onChange={onFileSelect}
            disabled={uploading}
          />
          <div className="drop-zone__text">
            {uploading
              ? "Загрузка…"
              : "Перетащите .bin сюда или нажмите для выбора"}
          </div>
          <div className="drop-zone__hint">Только .bin, макс. 4 МБ</div>
          {dropError && (
            <div
              className="drop-zone__hint"
              style={{ color: "var(--color-red)", marginTop: 8 }}
            >
              {dropError}
            </div>
          )}
        </div>
      </section>

      <section className="ota-trigger-section">
        <h2>Запуск OTA</h2>
        <div className="trigger-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleTriggerAll}
            disabled={triggeringAll || firmwares.length === 0}
          >
            {triggeringAll ? "Отправка…" : "OTA на все онлайн-устройства"}
          </button>
        </div>
        {devices.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 8,
              }}
            >
              На одно устройство (последняя прошивка):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {devices.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleTriggerDevice(d.id)}
                  disabled={d.status !== "online"}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid var(--button-secondary-border)",
                    background:
                      d.status === "online"
                        ? "var(--button-secondary-bg)"
                        : "var(--background-color)",
                    color: "var(--button-secondary-text)",
                    cursor: d.status === "online" ? "pointer" : "not-allowed",
                  }}
                >
                  {d.name || d.deviceId} {d.status !== "online" && "(offline)"}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="ota-list-section">
        <h2>Загруженные прошивки</h2>
        {listLoading ? (
          <div className="ota-list-empty">Загрузка…</div>
        ) : firmwares.length === 0 ? (
          <div className="ota-list-empty">Нет загруженных прошивок</div>
        ) : (
          <div className="ota-list">
            {firmwares.map((fw) => (
              <div key={fw.id} className="ota-card">
                <div className="ota-card__filename">{fw.filename}</div>
                <div className="ota-card__meta">
                  v{fw.version} · {formatSize(fw.size)}
                </div>
                <div className="ota-card__date">
                  {new Date(fw.createdAt).toLocaleString()}
                </div>
                {devices.some((d) => d.status === "online") && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {devices
                      .filter((d) => d.status === "online")
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleTriggerDevice(d.id, fw.filename)}
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            borderRadius: 4,
                            border: "none",
                            background: "var(--button-primary-bg)",
                            color: "var(--button-primary-text)",
                            cursor: "pointer",
                          }}
                        >
                          OTA → {d.name || d.deviceId}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
