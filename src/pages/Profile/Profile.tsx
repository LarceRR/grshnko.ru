import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api/user"; // Предполагается, что эта функция может принимать id
import "./Profile.scss";
import { API_URL } from "../../config";
import UserRoleIcon from "../../components/Navigator/NavUser/components/UserRoleIcon";
import dayjs from "dayjs";
import UserInfo from "./UserInfo";
import { Modal } from "antd";
import UserEditableFields from "./UserEditableFields";
import { useState } from "react";
import { LogOut, Pen } from "lucide-react";
import { useUser } from "../../hooks/useUser"; // Предполагается, что useUser предоставляет данные авторизованного пользователя
import { useParams } from "react-router-dom";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout, user: authUser } = useUser(); // Получаем авторизованного пользователя из useUser

  const { id } = useParams<{ id?: string }>(); // Получаем id из параметров URL

  // Запрос для пользователя, профиль которого просматривается (по id или авторизованный)
  const { data: profileUser, isLoading: isProfileUserLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id), // Передаем id в getUser
    retry: false,
    enabled: !!id, // Включаем запрос только если id существует
  });

  // Если id не предоставлен, то profileUser - это authUser. Иначе - profileUser из запроса.
  const user = id ? profileUser : authUser;
  const isLoading = id ? isProfileUserLoading : !authUser; // Общая загрузка

  if (isLoading) {
    return <div className="nav-user__loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // console.log("Rendering profile for user:", user);

  const blocks = [
    <div className="profile-header profile-block" key="header">
      <h1>
        Профиль
        {/* Кнопка "Выйти" показывается только если это профиль авторизованного пользователя */}
        {user.id === authUser?.id && (
          <button onClick={logout} style={{ background: "var(--color-red)" }}>
            <LogOut size={16} />
            Выйти
          </button>
        )}
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
        {(authUser?.permissions.includes("USER_CHANGE_ROLE") ||
          user.id === authUser?.id) && (
          <button onClick={() => setIsModalOpen(true)}>
            <Pen size={16} /> Редактировать
          </button>
        )}
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

  // Панель администратора показывается, если текущий авторизованный пользователь является админом
  // и если просматриваемый профиль - это профиль авторизованного пользователя (нет id в URL)
  if (!id && authUser?.role?.key === "ADMIN") {
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
        <UserEditableFields
          closeModal={() => setIsModalOpen(false)}
          requestedUser={user}
        />
      </Modal>
    </div>
  );
};

export default Profile;
