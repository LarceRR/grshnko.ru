import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getTelegramStatus,
  startTelegramAuth,
  sendPhoneCode,
  sendPassword,
  authViaQRCode,
  ITelegramStatus,
} from "../../../../api/telegram";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import useTheme from "../../../../hooks/useTheme";
import { useQRCode } from "../../../../hooks/useQRCode";

interface ITelegramAuthModalProps {
  initialStatus: ITelegramStatus | undefined;
  onClose: () => void;
}

const TelegramAuthModal: React.FC<ITelegramAuthModalProps> = ({
  initialStatus,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [theme] = useTheme();

  const { data: telegramStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: getTelegramStatus,
    initialData: initialStatus,
    refetchInterval: (query) => {
      const data = query.state.data as ITelegramStatus | undefined;
      return data?.authorizationInProgress && !data?.connected ? 2000 : false;
    },
  });

  const startAuthMutation = useMutation({
    mutationFn: startTelegramAuth,
    onSuccess: () => refetchStatus(),
  });

  const sendCodeMutation = useMutation({
    mutationFn: sendPhoneCode,
    onSuccess: () => refetchStatus(),
  });

  const sendPasswordMutation = useMutation({
    mutationFn: sendPassword,
    onSuccess: () => refetchStatus(),
  });

  const authViaQrMutation = useMutation({
    mutationFn: authViaQRCode,
    onSuccess: () => refetchStatus(),
  });

  // Хук для QR-кода
  const { qrRef, updateQRCode } = useQRCode({
    options: {
      width: 220,
      height: 220,
      image: theme === "light" ? "/favicon/light.png" : "/favicon/dark.png",
      dotsOptions: { color: "#0088cc", type: "rounded" },
      backgroundOptions: { color: "var(--background-color)" },
      cornersSquareOptions: { type: "extra-rounded" },
      imageOptions: { crossOrigin: "anonymous", imageSize: 0.3, margin: 4 },
    },
    data: telegramStatus?.qrToken || "",
  });

  // Автообновление QR при изменении токена
  useEffect(() => {
    if (telegramStatus?.qrToken) {
      updateQRCode(telegramStatus.qrToken);
    }
  }, [telegramStatus?.qrToken, updateQRCode]);

  useEffect(() => {
    if (telegramStatus?.awaitingPassword) {
      setShowQrCode(false);
    }
  }, [telegramStatus?.awaitingPassword]);

  // Автооткрытие QR при необходимости
  useEffect(() => {
    if (telegramStatus?.awaitingQrScan && !showQrCode) {
      setShowQrCode(true);
    }
  }, [telegramStatus?.awaitingQrScan, showQrCode]);

  // Автозакрытие при успешной авторизации
  useEffect(() => {
    if (telegramStatus?.connected) {
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [telegramStatus, onClose]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAuthMutation.mutate(phoneNumber);
  };
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCodeMutation.mutate(code);
  };
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPasswordMutation.mutate(password);
  };
  const handleQrCodeClick = () => {
    setShowQrCode(true);
    authViaQrMutation.mutate();
  };
  const handleBackToPhoneClick = () => {
    setShowQrCode(false);
    refetchStatus();
  };

  const isLoading =
    startAuthMutation.isPending ||
    sendCodeMutation.isPending ||
    sendPasswordMutation.isPending;

  if (telegramStatus?.connected) {
    return (
      <div className="telegram-auth-modal">
        <div className="avatar-and-icon-modal">
          <img src="/icons/Telegram.svg" alt="Telegram" />
          <h2>Авторизация завершена!</h2>
        </div>
        <div className="telegram-auth-success">
          <p>Вы успешно авторизовались как {telegramStatus.user?.firstName}</p>
          <p>Окно закроется автоматически...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-auth-modal">
      <div className="avatar-and-icon-modal">
        <img src="/icons/Telegram.svg" alt="Telegram" />
        <h2>Авторизация в Telegram</h2>
      </div>

      {telegramStatus?.error && (
        <div className="telegram-auth-error">
          <p>Ошибка: {telegramStatus.error}</p>
        </div>
      )}

      {showQrCode || telegramStatus?.awaitingQrScan ? (
        <div className="telegram-auth-qr-section">
          {authViaQrMutation.isPending && !telegramStatus?.qrToken && (
            <div className="telegram-auth-waiting">
              <p>Генерация QR-кода...</p>
              <LoadingBannerNoText />
            </div>
          )}

          {authViaQrMutation.isError && (
            <div className="telegram-auth-error">
              <p>Не удалось загрузить QR-код. Попробуйте снова.</p>
            </div>
          )}

          {telegramStatus?.qrToken && (
            <>
              <div className="qr-code-container">
                <div ref={qrRef} />
              </div>
              <p className="qr-instructions">
                Отсканируйте код в приложении Telegram: <br />
                <strong>Настройки</strong> → <strong>Устройства</strong> →{" "}
                <strong>Подключить устройство</strong>
              </p>
            </>
          )}

          {telegramStatus?.awaitingQrScan && (
            <div className="telegram-auth-waiting">
              <p>Ожидание сканирования QR-кода...</p>
              <LoadingBannerNoText />
            </div>
          )}

          <button
            className="telegram-auth__button-secondary"
            onClick={handleBackToPhoneClick}
            disabled={authViaQrMutation.isPending}
          >
            Войти по номеру телефона
          </button>
        </div>
      ) : telegramStatus?.awaitingPassword ? (
        <form className="telegram-auth__form" onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="password">Пароль (2FA)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={isLoading}
            />
            <small>Введите пароль двухфакторной аутентификации</small>
          </div>
          <button
            className="telegram-auth__button"
            type="submit"
            disabled={isLoading || !password}
          >
            {isLoading ? "Проверка..." : "Отправить пароль"}
          </button>
        </form>
      ) : telegramStatus?.awaitingPhoneCode ? (
        <form className="telegram-auth__form" onSubmit={handleCodeSubmit}>
          <div className="form-group">
            <label htmlFor="code">Код подтверждения</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345"
              required
              disabled={isLoading}
            />
            <small>Код был отправлен вам в Telegram</small>
          </div>
          <button
            className="telegram-auth__button"
            type="submit"
            disabled={isLoading || !code}
          >
            {isLoading ? "Проверка..." : "Отправить код"}
          </button>
        </form>
      ) : telegramStatus?.authorizationInProgress ? (
        <div className="telegram-auth-waiting">
          <p>Выполняется подключение...</p>
          <LoadingBannerNoText />
        </div>
      ) : (
        <form className="telegram-auth__form" onSubmit={handlePhoneSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Номер телефона</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+79123456789"
              required
              disabled={isLoading}
            />
          </div>
          <button
            className="telegram-auth__button"
            type="submit"
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? "Отправка..." : "Получить код"}
          </button>

          <div className="telegram-auth-divider">
            <span>ИЛИ</span>
          </div>

          <button
            className="telegram-auth__button-secondary"
            onClick={handleQrCodeClick}
            disabled={authViaQrMutation.isPending}
          >
            {authViaQrMutation.isPending ? "Загрузка..." : "Войти через QR-код"}
          </button>
        </form>
      )}
    </div>
  );
};

export default TelegramAuthModal;
