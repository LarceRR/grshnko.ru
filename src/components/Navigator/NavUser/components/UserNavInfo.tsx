import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../../../api/user";
import UserRoleIcon from "./UserRoleIcon";

const UserNavInfo = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: false,
  });

  // Показываем загрузку или ничего, если данные грузятся
  if (isLoading) {
    return <div className="nav-user__loading">Loading...</div>;
  }

  // Не показываем компонент, если пользователь не авторизован
  if (!user) {
    return null;
  }

  return (
    <div className="nav-user__details">
      <span className="nav-user__name">{user.username}</span>
      <span className="nav-user__email">{user.email}</span>
      <UserRoleIcon
        role={user.role || ""}
        style={{
          position: "absolute",
          right: -2,
          top: 4,
          width: 22,
          height: 22,
        }}
      />
    </div>
  );
};

export default UserNavInfo;
