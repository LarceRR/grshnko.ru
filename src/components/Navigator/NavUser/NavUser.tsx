import { useState, useRef, useEffect } from "react";
import { useNavUserMenu, NavUserMenuItem } from "./NavUserMenu";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../../api/user";
import "./NavUser.scss";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../../UserAvatar/UserAvatar";
import { CurrencyDisplay } from "../../CurrencyDisplay/CurrencyDisplay";

interface NavUserProps {
  showAvatar?: boolean;
  style?: React.CSSProperties;
  expanded?: boolean;
}

const NavUser: React.FC<NavUserProps> = ({
  showAvatar = true,
  style,
  expanded = false,
}) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });

  const [open, setOpen] = useState(false); // Изменил на false по умолчанию
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

  const goToProfile = () => navigate("/profile");

  return (
    <div
      style={style}
      className="nav-user"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="nav-user__info"
        onClick={goToProfile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goToProfile()}
      >
        {showAvatar && (
          <UserAvatar
            avatarUrl={user.avatarUrl}
            isOnline={true}
            size={40}
            className="nav-user__avatar"
          />
        )}
        {expanded && (
          <div className="nav-user__details">
            <div className="nav-user__name-row">
              <span className="nav-user__name">{user.username}</span>
              <CurrencyDisplay hideCurrencyName compact />
            </div>
            <span className="nav-user__email">{user.email}</span>
          </div>
        )}
      </div>

      <div className={`nav-user__dropdown ${open ? "visible" : ""}`}>
        {menuItems.map(
          (item: NavUserMenuItem) =>
            item.enabled && (
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
            ),
        )}
      </div>
    </div>
  );
};

export default NavUser;
