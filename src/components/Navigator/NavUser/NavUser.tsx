import { useState, useRef, useEffect } from "react";
import { UserOutlined } from "@ant-design/icons";
import { useNavUserMenu, NavUserMenuItem } from "./NavUserMenu";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../../api/user";
import "./NavUser.scss";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config";

interface NavUserProps {
  showAvatar?: boolean;
  style?: React.CSSProperties;
}

const NavUser: React.FC<NavUserProps> = ({
  showAvatar = true,
  style
}) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: false,
  });

  const [open, setOpen] = useState(true); // Изменил на false по умолчанию
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const menuItems = useNavUserMenu();

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  // Показываем загрузку или ничего, если данные грузятся
  if (isLoading) {
    return <div className="nav-user-loading">Loading...</div>;
  }

  // Не показываем компонент, если пользователь не авторизован
  if (!user) {
    return null;
  }

  return (
    <div
      style={style}
      className="nav-user"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="nav-user__info">
        {showAvatar && <div className="nav-user__avatar">
          {user.avatarUrl ? (
            <img
              src={`${API_URL}cdn/avatar/${user.avatarUrl}`}
              alt={user.username}
            />
          ) : (
            <UserOutlined color="var(--text-color)" />
          )}
        </div>}
      </div>

      <div className={`nav-user__dropdown ${open ? "visible" : ""}`}>
        {menuItems.map((item: NavUserMenuItem) => (
          <div
            key={item.key}
            className={`nav-user__dropdown-item ${
              item.danger ? "danger" : ""
            } ${item.underline ? "underline" : ""}`}
            onClick={() => {
              if (item.link) {
                navigate(item.link); // переход по ссылке
                setOpen(false); // закрыть дропдаун
              } else {
                item.onClick?.(); // вызвать кастомное действие
                if (item.closeOnClick) setOpen(false);
              }
            }}
          >
            {item.icon && (
              <span className="nav-user__dropdown-icon">{item.icon}</span>
            )}
            <span className="nav-user__dropdown-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NavUser;
