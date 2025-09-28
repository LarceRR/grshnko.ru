// components/UserListButton/UserListButton.tsx

import { useQuery } from "@tanstack/react-query";
import "./DataBaseButton.scss"; // Предполагается, что у вас есть стили
import { Database } from "lucide-react";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import StatusIndicator from "../../../../components/StatusIndicator/StatusIndicator";
import { getDatabaseStatus } from "../../../../api/system";
import { Modal } from "antd";
import { useState } from "react";

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
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        title="Состояние базы данных"
      >
        {database ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <strong>Подключение:</strong>{" "}
              {database.connected ? "✅ Online" : "❌ Offline"}
            </div>
            <div>
              <strong>Имя базы:</strong> {database.dbName}
            </div>
            <div>
              <strong>Количество коллекций:</strong> {database.collectionsCount}
            </div>

            <div>
              <strong>Коллекции:</strong>
              <ul style={{ margin: "0.5rem 0 0 1rem" }}>
                {database.collections.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Статистика:</strong>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(database.stats).map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 8px",
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}
                      >
                        {key}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px 8px",
                          textAlign: "right",
                        }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <span>Нет данных</span>
        )}
      </Modal>
    </div>
  );
};

export default DataBaseButton;
