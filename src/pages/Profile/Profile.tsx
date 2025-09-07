import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api/user";
import "./Profile.scss";
import { API_URL } from "../../config";

const Profile = () => {
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
    <div className="profile-card">
      <div className="profile-header">
        <img
          className="profile-avatar"
          src={`${API_URL}cdn/avatar/${user.username}` || "/default-avatar.png"}
          alt={user.username}
        />
        <div className="profile-info">
          <h2 className="profile-username">
            {user.username}
            {user.isVerified && <span className="verified">✔</span>}
          </h2>
          <p className="profile-email">{user.email}</p>
          {user.role && (
            <span
              className={`profile-role ${user.role === "ADMIN" ? "admin" : ""}`}
            >
              {user.role}
            </span>
          )}
        </div>
      </div>

      {user.bio && <p className="profile-bio">{user.bio}</p>}

      <div className="profile-extra">
        {user.location && (
          <p>
            📍 <span>{user.location}</span>
          </p>
        )}
        {user.website && (
          <p>
            🔗{" "}
            <a href={user.website} target="_blank" rel="noopener noreferrer">
              {user.website}
            </a>
          </p>
        )}
        {user.lastLoginAt && (
          <p>
            🕒 Последний вход: {new Date(user.lastLoginAt).toLocaleString()}
          </p>
        )}
        {user.createdAt && (
          <p>
            📅 Зарегистрирован: {new Date(user.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default Profile;
