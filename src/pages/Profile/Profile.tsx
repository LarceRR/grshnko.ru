import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api/user";
import "./Profile.scss";
import { API_URL } from "../../config";
import UserRoleIcon from "../../components/Navigator/NavUser/components/UserRoleIcon";
import dayjs from "dayjs";
import UserInfo from "./UserInfo";
import { Modal } from "antd";
import UserEditableFields from "./UserEditableFields";
import { useState } from "react";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: false,
  });

  if (isLoading) {
    return <div className="nav-user__loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-card">
      <div className="profile-header profile-block">
        <h1>Профиль</h1>
        <button onClick={() => setIsModalOpen(true)}>Редактировать</button>
        <div className="profile-block__body">
          <img
            className="profile-avatar"
            src={
              `${API_URL}cdn/avatar/${user.username}` || "/default-avatar.png"
            }
            alt={user.username}
          />
          <div className="profile-info">
            <h2 className="profile-username">
              {user.username}
              {user.isVerified && <span className="verified">✔</span>}
            </h2>
            <p className="profile-email">{user.email}</p>
            <UserInfo content={user.bio || "Расскажите о себе"} noCopy />
          </div>
        </div>
      </div>

      <div className="profile-block">
        <h1>Персональная информация</h1>
        <div className="profile-info-block">
          <UserInfo title="Имя" content="" />
          <UserInfo title="Фамилия" content="" />

          <UserInfo
            title="Дата рождения"
            content={dayjs(user.birthDate).format("DD.MM.YYYY")}
          />
          <UserInfo title="Электронная почта" content={user.email} />
        </div>
        <h1 style={{ marginTop: "20px" }}>Техническая информация</h1>
        <div className="profile-info-block">
          <UserInfo
            title="Группа"
            content={
              <UserRoleIcon
                role={user.role || ""}
                displayMode="full"
                className="profile-role-icon"
                style={{
                  lineHeight: "20px",
                  width: "fit-content",
                  fontSize: "16px",
                  height: "auto",
                  fontWeight: 600,
                }}
                variant="text"
                showFullName
              />
            }
          />
          <UserInfo
            title="Дата регистрации"
            content={dayjs(user.createdAt).format("DD.MM.YYYY")}
          />
          <UserInfo
            title="Последнее обновление"
            content={
              <>
                <span>
                  {dayjs(user.updatedAt).startOf("millisecond").fromNow()}
                </span>
                <span> в {dayjs(user.updatedAt).format("HH:mm")}</span>
              </>
            }
          />
          <UserInfo title="Последняя активность" content="" />
          <UserInfo title="Идентификатор" content={user.id} />
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="profile-block">
          <h1>Панель администратора</h1>
          <div>админ-действия</div>
        </div>
      )}
      <Modal open={isModalOpen} onCancel={() => setIsModalOpen(false)}>
        <UserEditableFields />
      </Modal>
    </div>
  );
};

export default Profile;
