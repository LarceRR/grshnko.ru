import React, { CSSProperties } from "react";

interface UserRoleIconProps {
  role: "ADMIN" | "USER" | "MODERATOR" | "PREMIUM" | "BOT" | string;
  style?: CSSProperties;
  className?: string;
  displayMode?: "short" | "full"; // короткий/полный вид (символ или текст)
  showFullName?: boolean; // новый проп: показывать полное название роли
  variant?: "background" | "text"; // новый проп: цветной фон или цветной текст
}

const roleColors: Record<UserRoleIconProps["role"], string> = {
  ADMIN: "#FF4D4F",
  USER: "#1890FF",
  MODERATOR: "#52C41A",
  PREMIUM: "#FAAD14",
  BOT: "#722ED1",
};

const roleFullNames: Record<UserRoleIconProps["role"], string> = {
  ADMIN: "Администратор",
  USER: "Пользователь",
  MODERATOR: "Модератор",
  PREMIUM: "Премиум",
  BOT: "Бот",
};

const UserRoleIcon: React.FC<UserRoleIconProps> = ({
  role,
  style,
  className,
  displayMode = "short",
  showFullName = false,
  variant = "background",
}) => {
  const color = roleColors[role] || "#d9d9d9";

  // Определяем, что отображать внутри
  let text = "";
  if (showFullName) {
    text = roleFullNames[role] || role;
  } else if (displayMode === "full") {
    text = role;
  } else {
    text = role.charAt(0);
  }

  const isBackground = variant === "background";

  return (
    <span
      style={{
        width: isBackground ? (displayMode === "full" ? "auto" : 24) : "auto",
        padding: isBackground && displayMode === "full" ? "5px 6px" : 0,
        height: isBackground && displayMode === "full" ? "auto" : 24,
        borderRadius: isBackground ? 6 : 0,
        backgroundColor: isBackground ? color : "transparent",
        color: isBackground ? "#fff" : color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        ...style,
      }}
      title={roleFullNames[role] || role}
      className={className}
    >
      {text}
    </span>
  );
};

export default UserRoleIcon;
