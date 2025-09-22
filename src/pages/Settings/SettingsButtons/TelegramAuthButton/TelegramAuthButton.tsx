import "./TelegramAuthButton.scss"; // Предполагается, что у вас есть стили
import { useState } from "react";

const TelegramAuthButton = () => {
  // const navigate = useNavigate();
  const [mokeTelegramData, _] = useState({
    isConnected: true,
    isSessionFileExists: true,
    isAuthorizationRequired: false,
    username: "grshnko_bot",
    firstName: "Руслан",
    lastName: "Bot",
  });
  // const {
  //   data: count, // `count` теперь автоматически имеет тип `number | undefined`
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   // Рекомендация: использовать более конкретный ключ для запроса количества
  //   queryKey: ["usersListCount"],
  //   queryFn: () => getAllUsers(true), // TypeScript теперь знает, что это вернет Promise<number>
  //   retry: false,
  // });

  return (
    <div className="settings-telegram-auth-button">
      {/* {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>} */}
      <div>
        <img src="/icons/Telegram.svg"></img>
        <span>
          {mokeTelegramData.isConnected
            ? `Telegram подключен (${mokeTelegramData.firstName})`
            : "Telegram не подключен, нажмите для входа"}
        </span>
      </div>
      <div>
        {mokeTelegramData.isAuthorizationRequired ? (
          <span>Требуется авторизация</span>
        ) : (
          <span>Авторизация не требуется</span>
        )}
        {mokeTelegramData.isSessionFileExists ? (
          <span>Файл сессии существует</span>
        ) : (
          <span>Файл сессии не найден</span>
        )}
      </div>
    </div>
  );
};

export default TelegramAuthButton;
