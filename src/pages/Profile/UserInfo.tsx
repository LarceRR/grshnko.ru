import useMessage from "antd/es/message/useMessage";
import React, { ReactNode } from "react";

interface IUserInfoProps {
  content?: string | ReactNode;
  title?: string | ReactNode;
  noCopy?: boolean;
}

const UserInfo: React.FC<IUserInfoProps> = ({ content, title, noCopy }) => {
  const [messageApi, contextHolder] = useMessage();

  const handleClick = () => {
    if (!noCopy) {
      const info = () => {
        messageApi.success("Скопировано");
      };

      // Копируем только если content - это строка
      if (typeof content === "string") {
        navigator.clipboard.writeText(content);
        info();
      }
    }
  };

  return (
    <div className="profile-row">
      {contextHolder}
      <span className="profile-label">{title}</span>
      <span
        className={`profile-value ${
          typeof content === "string" ? "clickable" : ""
        }`}
        style={{
          cursor:
            typeof content === "string" && content && !noCopy
              ? "pointer"
              : "default",
        }}
        onClick={content ? handleClick : undefined}
        title={
          typeof content === "string" ? "Нажмите, чтобы скопировать" : undefined
        }
      >
        {content || "Нет данных"}
      </span>
    </div>
  );
};

export default UserInfo;
