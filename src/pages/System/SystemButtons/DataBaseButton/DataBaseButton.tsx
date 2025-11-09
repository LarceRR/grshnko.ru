// components/UserListButton/UserListButton.tsx

import { useQuery } from "@tanstack/react-query";
import "./DataBaseButton.scss"; // Предполагается, что у вас есть стили
import { Database } from "lucide-react";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import StatusIndicator from "../../../../components/StatusIndicator/StatusIndicator";
import { getDatabaseStatus } from "../../../../api/system";
import { Modal } from "antd";
import { useState } from "react";

const STAT_NUMBER_FORMAT = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

const formatNumberValue = (value: number) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return STAT_NUMBER_FORMAT.format(rounded);
};

const formatByteSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return formatNumberValue(bytes);
  }

  if (bytes === 0) {
    return "0 B";
  }

  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${formatNumberValue(value)} ${BYTE_UNITS[unitIndex]}`;
};

const isNumericValue = (value: unknown): value is number => {
  return typeof value === "number" && !Number.isNaN(value);
};

const parseNumericString = (value: string): number | null => {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
};

const formatStatValue = (key: string, value: unknown): string => {
  const keyLower = key.toLowerCase();
  const shouldFormatAsSize =
    keyLower.includes("size") || keyLower.includes("byte");

  if (isNumericValue(value)) {
    return shouldFormatAsSize
      ? formatByteSize(value)
      : formatNumberValue(value);
  }

  if (typeof value === "string") {
    const parsed = parseNumericString(value);

    if (parsed !== null) {
      return shouldFormatAsSize
        ? formatByteSize(parsed)
        : formatNumberValue(parsed);
    }

    return value;
  }

  if (value === null || value === undefined) {
    return "—";
  }

  return String(value);
};

const DataBaseButton = () => {
  const {
    data: database,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["database_status"],
    queryFn: () => getDatabaseStatus(),
    retry: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const isConnected = Boolean(database?.connected);
  const statusLabel = isConnected ? "Online" : "Offline";
  const statusKey = isConnected ? "online" : "offline";
  const collections = database?.collections ?? [];
  const statsEntries = database?.stats ? Object.entries(database.stats) : [];

  return (
    <div className="user-list-button" onClick={() => setIsModalOpen(true)}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      <div>
        <div className="centered">
          <Database size={28} />
        </div>
        <div className="centered">
          <span
            style={{
              fontSize: "22px",
              textAlign: "center",
            }}
          >
            <StatusIndicator
              status={database?.connected ? "ENABLED" : "DISABLED"}
            />
            <br></br>
            <span
              style={{
                fontSize: "16px",
                textAlign: "center",
                opacity: 0.5,
                marginTop: "10px",
              }}
            >
              {database?.connected ? "Online" : "Offline"}
            </span>
          </span>
        </div>
        <div
          className="centered"
          style={{
            gridColumn: "span 2",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              height: "fit-content",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            Состояние базы данных
          </span>
        </div>
      </div>
      <Modal
        className="database-status-modal"
        open={isModalOpen}
        centered
        width={680}
        onCancel={handleModalClose}
        footer={null}
        title={
          <div className="database-status-modal__title">
            <span>Состояние базы данных</span>
            <span
              className={`database-status-modal__badge database-status-modal__badge--${statusKey}`}
            >
              {statusLabel}
            </span>
          </div>
        }
      >
        {database ? (
          <div className="database-status-modal__content">
            <div className="database-status-modal__summary">
              <div className="database-status-modal__icon">
                <Database size={24} />
              </div>
              <div className="database-status-modal__summary-text">
                <span className="database-status-modal__summary-label">
                  Подключение
                </span>
                <span className="database-status-modal__summary-value">
                  {isConnected
                    ? "Соединение установлено и работает корректно."
                    : "Нет активного подключения к базе данных."}
                </span>
              </div>
            </div>

            <div className="database-status-modal__meta">
              <div className="database-status-modal__meta-item">
                <span className="database-status-modal__meta-label">
                  Имя базы
                </span>
                <span className="database-status-modal__meta-value">
                  {database.dbName || "—"}
                </span>
              </div>
              <div className="database-status-modal__meta-item">
                <span className="database-status-modal__meta-label">
                  Коллекций
                </span>
                <span className="database-status-modal__meta-value">
                  {database.collectionsCount ?? "—"}
                </span>
              </div>
            </div>

            <div className="database-status-modal__section">
              <span className="database-status-modal__section-title">
                Коллекции
              </span>
              {collections.length ? (
                <div className="database-status-modal__collections">
                  {collections.map((collection) => (
                    <span
                      className="database-status-modal__collection-chip"
                      key={collection}
                      title={collection}
                    >
                      {collection}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="database-status-modal__empty">
                  Список коллекций недоступен
                </span>
              )}
            </div>

            <div className="database-status-modal__section">
              <span className="database-status-modal__section-title">
                Статистика
              </span>
              {statsEntries.length ? (
                <dl className="database-status-modal__stats">
                  {statsEntries.map(([key, value]) => (
                    <div className="database-status-modal__stats-row" key={key}>
                      <dt className="database-status-modal__stats-key">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="database-status-modal__stats-value">
                        {formatStatValue(key, value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <span className="database-status-modal__empty">
                  Нет данных по статистике
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="database-status-modal__empty-state">
            <span>Нет данных о состоянии базы</span>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataBaseButton;
