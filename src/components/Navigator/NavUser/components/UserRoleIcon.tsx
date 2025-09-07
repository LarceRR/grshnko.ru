import React, { CSSProperties } from "react";

interface UserRoleIconProps {
  role: "ADMIN" | "USER" | "MODERATOR" | "PREMIUM" | "BOT" | string;
  style?: CSSProperties;
}

const roleColors: Record<UserRoleIconProps["role"], string> = {
  ADMIN: "#FF4D4F", // красный
  USER: "#1890FF", // синий
  MODERATOR: "#52C41A", // зелёный
  PREMIUM: "#FAAD14", // жёлтый/оранжевый
  BOT: "#722ED1", // фиолетовый
};

const UserRoleIcon: React.FC<UserRoleIconProps> = ({ role, style }) => {
  const color = roleColors[role] || "#d9d9d9"; // серый по умолчанию
  const firstLetter = role.charAt(0);

  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        ...style,
      }}
      title={role}
    >
      {firstLetter}
    </div>
  );
};

export default UserRoleIcon;
