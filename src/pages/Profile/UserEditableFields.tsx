import React, { useState } from "react";
import { useUser } from "../../hooks/useUser";
import EditableField from "../../components/EditableField/EditableField";
import EditableAvatar from "./EditableAvatar";
import { Button, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import UserRoleChanger from "./UserProfileChanger/UserRoleChanger";
import { Role, User } from "../../types/user";
import { useNotify } from "../../hooks/useNotify";

interface UserUpdates {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  role?: Role;
  bio?: string;
  avatar?: File | null;
}

const UserEditableFields: React.FC<{
  closeModal: () => void;
  requestedUser?: User;
}> = ({ closeModal, requestedUser }) => {
  const { user: me, isLoading, updateUser, updateError } = useUser();
  const [userUpdates, setUserUpdates] = useState<UserUpdates>({});
  const { notify, contextHolder } = useNotify();

  const user = requestedUser ? requestedUser : me; // редактируем только свой профиль

  const handleFieldChange = (
    field: keyof UserUpdates,
    value: string | File | null | Dayjs
  ) => {
    setUserUpdates((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async () => {
    if (!user) return;

    try {
      // console.log("Updating user with:", user);
      await updateUser({
        data: userUpdates,
        userId: requestedUser?.id,
      });
      notify({
        title: "Успех",
        body: "Профиль успешно обновлен",
        type: "success",
      });
      setUserUpdates({}); // очищаем изменения после успешного апдейта
      closeModal();
    } catch (err) {
      console.error("Ошибка при обновлении пользователя:", err);
      notify({
        title: "Ошибка",
        body: "Возникла ошибка при изменении профиля.",
        type: "error",
      });
    }
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="user-editable-fields">
      {contextHolder}
      <h2>Редактирование профиля</h2>

      {/* Аватар */}
      <EditableAvatar
        avatarUrl={user.avatarUrl}
        onSave={async (file) => {
          handleFieldChange("avatar", file);
        }}
      />

      {/* О себе */}
      <EditableField
        label="О себе"
        value={user.bio || ""}
        onChange={(val) => handleFieldChange("bio", val)}
      />

      <UserRoleChanger
        user={user}
        onRoleChange={(role) => handleFieldChange("role", role || "")}
      />

      <div className="user-editable-fields__fields">
        {/* Имя */}
        <EditableField
          label="Имя"
          value={user.firstName || ""}
          onChange={(val) => handleFieldChange("firstName", val)}
        />

        {/* Фамилия */}
        <EditableField
          label="Фамилия"
          value={user.lastName || ""}
          onChange={(val) => handleFieldChange("lastName", val)}
        />

        {/* Дата рождения с DatePicker */}
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: 12,
              marginLeft: 12,
            }}
          >
            Дата рождения
          </label>
          <DatePicker
            style={{
              width: "100%",
              height: 40,
              backgroundColor: "var(--background-color)",
              border: "1px solid var(--border-color)",
            }}
            value={
              userUpdates.birthDate
                ? dayjs(userUpdates.birthDate)
                : user.birthDate
                  ? dayjs(user.birthDate)
                  : null
            }
            onChange={(date) => {
              if (date) {
                const isoString = dayjs(date).format(
                  "YYYY-MM-DDTHH:mm:ss.SSS[+00:00]"
                );
                // console.log(isoString);
                handleFieldChange("birthDate", isoString);
              }
            }}
            disabledDate={(current: Dayjs) => {
              // запрещаем даты после сегодня и до 1920 года
              const today = dayjs();
              const minDate = dayjs("1920-01-01");
              return (
                current.isAfter(today, "day") ||
                current.isBefore(minDate, "day")
              );
            }}
          />
        </div>

        {/* Почта */}
        <EditableField
          label="Электронная почта"
          value={user.email || ""}
          onChange={(val) => handleFieldChange("email", val)}
        />
      </div>

      <Button
        onClick={() => handleUpdateUser()}
        className="save-button"
        loading={isLoading}
        style={{
          background: updateError
            ? "var(--button-danger-bg)"
            : "var(--button-primary-bg)!important",
        }}
      >
        {updateError
          ? updateError.message
          : isLoading
            ? "Сохранение..."
            : "Сохранить"}
      </Button>
    </div>
  );
};

export default UserEditableFields;
