import React from "react";
import { useUser } from "../../hooks/useUser";
import EditableField from "../../components/EditableField/EditableField";
import EditableAvatar from "./EditableAvatar";

const UserEditableFields: React.FC = () => {
  const { user, isLoading, updateUser } = useUser();

  if (isLoading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="user-editable-fields">
      <h2>Редактирование профиля</h2>

      {/* Аватар */}
      <EditableAvatar
        avatarUrl={user.avatarUrl}
        onSave={(file) => {
          const formData = new FormData();
          formData.append("userId", user.id);
          if (file) {
            formData.append("avatar", file);
          }
          return fetch(`/api/user/avatar`, {
            method: "POST",
            body: formData,
            credentials: "include",
          }).then((res) => {
            if (!res.ok) throw new Error("Ошибка загрузки аватара");
          });
        }}
      />

      {/* Имя */}
      <EditableField
        label="Имя"
        value={user.firstName || ""}
        onSave={(val) => updateUser({ firstName: val })}
      />

      {/* Фамилия */}
      <EditableField
        label="Фамилия"
        value={user.lastName || ""}
        onSave={(val) => updateUser({ lastName: val })}
      />

      {/* Дата рождения */}
      <EditableField
        label="Дата рождения"
        value={user.birthDate || ""}
        onSave={(val) => updateUser({ birthDate: val })}
      />

      {/* Почта */}
      <EditableField
        label="Электронная почта"
        value={user.email || ""}
        onSave={(val) => updateUser({ email: val })}
      />
    </div>
  );
};

export default UserEditableFields;
