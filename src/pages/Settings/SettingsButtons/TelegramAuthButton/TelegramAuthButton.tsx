import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./TelegramAuthButton.scss";
import { getTelegramStatus } from "../../../../api/telegram";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import { Modal } from "antd";
import TelegramAuthModal from "./TelegramAuthModal";
import { useState } from "react";
import React from "react"; // Импортируем React для типа события

const TelegramAuthButton = () => {
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: getTelegramStatus,
    retry: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ИЗМЕНЕНО: Создаем единую, универсальную функцию закрытия
  const handleClose = (e?: React.MouseEvent<HTMLElement>) => {
    // 1. Проверяем, было ли передано событие `e`. Если да - вызываем preventDefault.
    if (e) {
      e.stopPropagation();
    }

    // 2. Эта логика выполняется в любом случае.
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
    console.log("Modal closed and status query invalidated.");
  };

  return (
    <div
      className="settings-telegram-auth-button"
      onClick={status?.connected ? undefined : () => setIsModalOpen(true)}
    >
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      {status && (
        <>
          <div>
            {status.user?.avatar ? (
              <div className="avatar-and-icon">
                <img src="/icons/Telegram.svg" alt="Telegram Icon" />
                <img src={status.user.avatar} alt="User Avatar" />
              </div>
            ) : (
              <img
                src="/icons/Telegram.svg"
                className="telegram-icon"
                alt="Telegram Icon"
              />
            )}
            <span>
              {status.connected
                ? `Telegram подключен (${status.user?.firstName})`
                : "Telegram не подключен, нажмите для входа"}
            </span>
          </div>
          <div>
            <span>
              {status.connected
                ? "Авторизация пройдена"
                : "Требуется авторизация"}
            </span>
          </div>
        </>
      )}

      <Modal
        open={isModalOpen && !status?.connected}
        // ИЗМЕНЕНО: Передаем нашу новую универсальную функцию
        onCancel={handleClose}
        centered
        footer={null}
      >
        <TelegramAuthModal
          initialStatus={status}
          // ИЗМЕНЕНО: И сюда тоже передаем ту же самую функцию
          onClose={handleClose}
        />
      </Modal>
    </div>
  );
};

export default TelegramAuthButton;
