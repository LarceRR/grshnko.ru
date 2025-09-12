import React, { CSSProperties } from "react";
import { Role } from "../../../../types/user";

interface UserRoleIconProps {
  role?: Role;
  style?: CSSProperties;
  className?: string;
  displayMode?: "short" | "full"; // короткий/полный вид (символ или текст)
  showFullName?: boolean; // показывать полное название роли
  variant?: "background" | "text"; // цветной фон или цветной текст
}

const UserRoleIcon: React.FC<UserRoleIconProps> = ({
  role,
  style,
  className,
  displayMode = "short",
  showFullName = false,
  variant = "background",
}) => {
  if (!role) {
    return null; // если роли нет — ничего не рендерим
  }

  // Определяем, что отображать внутри
  let text: string;
  if (showFullName || displayMode === "full") {
    text = role.name || "";
  } else {
    text = role.key?.charAt(0) || "?";
  }

  const isBackground = variant === "background";

  return (
    <span
      style={{
        width: isBackground ? (displayMode === "full" ? "auto" : 24) : "auto",
        padding: isBackground && displayMode === "full" ? "5px 6px" : 0,
        height: isBackground && displayMode === "full" ? "auto" : 24,
        borderRadius: isBackground ? 6 : 0,
        backgroundColor: isBackground ? role.color || "#999" : "transparent",
        color: isBackground ? "#fff" : role.color || "#333",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        ...style,
      }}
      title={role.name || ""}
      className={className}
    >
      {text}
    </span>
  );
};

export default UserRoleIcon;
