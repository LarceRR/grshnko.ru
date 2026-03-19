import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser } from "../../api/user";
import { chatApi } from "../../api/chat";
import "./Profile.scss";
import UserRoleIcon from "../../components/Navigator/NavUser/components/UserRoleIcon";
import dayjs from "dayjs";
import UserInfo from "./UserInfo";
import { Modal, message } from "antd";
import UserEditableFields from "./UserEditableFields";
import { useState } from "react";
import { LogOut, Pen, MessageSquare } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useParams, useNavigate } from "react-router-dom";
import ActiveSessions from "./ActiveSessions/ActiveSessions";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import { CurrencyDisplay } from "../../components/CurrencyDisplay/CurrencyDisplay";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout, user: authUser } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { id } = useParams<{ id?: string }>();

  const startDM = useMutation({
    mutationFn: (targetUserId: string) =>
      chatApi.createDirectSession(targetUserId).then((r) => r.data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      navigate(`/chat/${session.id}`);
    },
    onError: () => {
      message.error("Не удалось создать чат");
    },
  });

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

  const isOtherUser = !!id && id !== authUser?.id;

  const blocks = [
    <div className="profile-header profile-block" key="header">
      <h1>
        Профиль
        <div style={{ display: "flex", gap: 8 }}>
          {isOtherUser && id && (
            <button
              onClick={() => startDM.mutate(id)}
              disabled={startDM.isPending}
            >
              <MessageSquare size={16} />
              {startDM.isPending ? "Открытие…" : "Написать"}
            </button>
          )}
          {user.id === authUser?.id && (
            <button onClick={logout} style={{ background: "var(--color-red)" }}>
              <LogOut size={16} />
              Выйти
            </button>
          )}
        </div>
      </h1>
      <div className="profile-block__body">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          isOnline={user.isOnline}
          size={100}
          style={{ border: "2px solid var(--border-color)" }}
        />
        <div className="profile-info">
          <h2 className="profile-username">
            {user.username}
            {user.isVerified && <span className="verified">✔</span>}
            <CurrencyDisplay userId={user.id} hideCurrencyName compact />
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

  if (
    authUser && // пользователь авторизован
    (authUser.permissions.includes("MY_SESSIONS_LIST") ||
      authUser.permissions.includes("SESSIONS_LIST"))
  ) {
    const isSelf = !id || id === authUser.id; // если это мой профиль
    const sessionsUserId = isSelf ? authUser.id : id; // чей ID использовать

    blocks.push(
      <div className="profile-block" key="sessions">
        <h1>
          Активные сессии
          {isSelf && (
            <button style={{ background: "var(--color-red)" }}>
              <LogOut size={16} /> Завершить все сессии
            </button>
          )}
        </h1>

        <ActiveSessions userId={sessionsUserId} />
      </div>,
    );
  }
  // Панель администратора показывается, если текущий авторизованный пользователь является админом
  // и если просматриваемый профиль - это профиль авторизованного пользователя (нет id в URL)
  if (!id && authUser?.role?.key === "ADMIN") {
    blocks.push(
      <div className="profile-block" key="admin-panel">
        <h1>Панель администратора</h1>
        <div>админ-действия</div>
      </div>,
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
