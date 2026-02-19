import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { API_URL } from "../../config";
import "./UserAvatar.scss";

interface UserAvatarProps {
  /** Raw filename from user.avatarUrl, e.g. "abc123.png". Pass null/undefined for placeholder. */
  avatarUrl?: string | null;
  /** When true — green dot; false — gray dot; undefined — no dot shown. */
  isOnline?: boolean;
  /** Diameter in px. Default: 40. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Renders a circular user avatar with an optional online/offline status dot.
 * The dot is positioned absolutely at the bottom-right corner.
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  isOnline,
  size = 40,
  className,
  style,
  onClick,
}) => {
  const dotSize = Math.max(8, Math.round(size * 0.26));

  return (
    <div
      className={`user-avatar-root${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, ...style }}
      onClick={onClick}
    >
      {avatarUrl ? (
        <img
          src={`${API_URL}cdn/avatar/${avatarUrl}`}
          alt="avatar"
          className="user-avatar-root__img"
        />
      ) : (
        <div className="user-avatar-root__placeholder">
          <UserOutlined style={{ fontSize: size * 0.45 }} />
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`user-avatar-root__dot user-avatar-root__dot--${isOnline ? "online" : "offline"}`}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
