// components/UserListButton/UserListButton.tsx

import { getAllUsers } from "../../../../api/user";
import { useQuery } from "@tanstack/react-query";
import "./UserListButton.scss"; // Предполагается, что у вас есть стили
import { User } from "lucide-react";
import { useNavigate } from "react-router";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";

const UserListButton = () => {
  const navigate = useNavigate();
  const {
    data: count, // `count` теперь автоматически имеет тип `number | undefined`
    isLoading,
    isError,
  } = useQuery({
    // Рекомендация: использовать более конкретный ключ для запроса количества
    queryKey: ["usersListCount"],
    queryFn: () => getAllUsers(true), // TypeScript теперь знает, что это вернет Promise<number>
    retry: false,
  });

  return (
    <div className="user-list-button" onClick={() => navigate("/system/users")}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      {typeof count === "number" && (
        <div>
          <div className="centered">
            <User size={34} />
          </div>
          <div className="centered">
            <span
              style={{
                fontSize: "22px",
                textAlign: "center",
              }}
            >
              {count}
              <br></br>
              <span
                style={{
                  fontSize: "16px",
                  textAlign: "center",
                  opacity: 0.5,
                }}
              >
                Всего
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
              Список пользователей
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListButton;
