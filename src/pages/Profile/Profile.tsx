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
import { LogOut, Pen } from "lucide-react";
import { useUser } from "../../hooks/useUser";
// import { useParams } from "react-router";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout } = useUser();
  // const { username } = useParams();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });

  if (isLoading) {
    return <div className="nav-user__loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const blocks = [
    <div className="profile-header profile-block" key="header">
      <h1>
        Профиль
        <button onClick={logout} style={{ background: "var(--color-red)" }}>
          <LogOut size={16} />
          Выйти
        </button>
      </h1>
      <div className="profile-block__body">
        <img
          className="profile-avatar"
          src={
            `${API_URL}cdn/avatar/${user.avatarUrl}` || "/default-avatar.png"
          }
          alt={user.username}
        />
        <div className="profile-info">
          <h2 className="profile-username">
            {user.username}
            {user.isVerified && <span className="verified">✔</span>}
          </h2>
          <UserInfo content={user.bio || "Расскажите о себе"} noCopy />
        </div>
      </div>
    </div>,
    <div className="profile-block" key="personal-info">
      <h1>
        Персональная информация
        <button onClick={() => setIsModalOpen(true)}>
          <Pen size={16} /> Редактировать
        </button>
      </h1>
      <div className="profile-info-block">
        <UserInfo title="Имя" content={user.firstName} />
        <UserInfo title="Фамилия" content={user.lastName} />
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
              role={user.role}
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
    </div>,
  ];

  if (user?.role?.key === "ADMIN") {
    blocks.push(
      <div className="profile-block" key="admin-panel">
        <h1>Панель администратора</h1>
        <div>админ-действия</div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="profile-animated-block"
          style={{
            opacity: 0,
            animation: `fadeIn 0.4s ease forwards`,
            animationDelay: `${index * 40}ms`,
          }}
        >
          {block}
        </div>
      ))}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <UserEditableFields closeModal={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Profile;
