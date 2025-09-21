import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../../../api/permission";
import { Select, Spin } from "antd";
import "./UserRoleChanger.scss";
import { Role, User } from "../../../types/user";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "../../../hooks/useUser";

interface IUserRoleChangerProps {
  user: User;
  onRoleChange: (role: string) => void;
}

const UserRoleChanger: React.FC<IUserRoleChangerProps> = ({
  user,
  onRoleChange,
}) => {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["role"],
    queryFn: getRoles,
    retry: false,
  });
  const { user: authUser } = useUser();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(
    user.role?.key || ""
  );

  // обновляем выбранное значение, если user.role изменился снаружи
  useEffect(() => {
    setSelectedRole(user.role?.key || "");
  }, [user.role]);

  const RoleItem = (role: Role) => (
    <div className="user-role-changer__role">
      <span style={{ color: role.color }}>{role.name}</span>
      <span>{role.key}</span>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      <label
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: 12,
          marginLeft: 12,
        }}
      >
        Ваша роль
      </label>
      {isLoading ? (
        <Spin />
      ) : (
        <Select
          showSearch
          value={selectedRole} // <-- контролируемое значение
          onSelect={(value) => {
            // console.log(value);
            setSelectedRole(value);
            onRoleChange(value);
          }}
          onDropdownVisibleChange={(open) => setIsDropdownOpen(open)}
          disabled={
            !!authUser && !authUser.permissions.includes("USER_CHANGE_ROLE")
          }
          placeholder="Выберите роль"
          optionFilterProp="label"
          notFoundContent={
            <div
              style={{
                color: "var(--text-color)",
                textAlign: "center",
                width: "100%",
                padding: "16px 0px",
              }}
            >
              Ничего не найдено
            </div>
          }
          optionLabelProp="labelPlain"
          className="user-role-changer"
          style={{
            width: "100%",
            height: 42,
            opacity:
              !!authUser && !authUser.permissions.includes("USER_CHANGE_ROLE")
                ? 0.5
                : 1,
          }}
          options={roles?.map((role) => ({
            value: role.key,
            label: RoleItem(role),
            labelPlain: role.name,
            keyValue: role.key,
          }))}
          filterOption={(input, option) =>
            (option?.labelPlain as string)
              .toLowerCase()
              .includes(input.toLowerCase()) ||
            (option?.keyValue as string)
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          suffixIcon={
            <ChevronDown
              color="var(--text-color)"
              style={{
                opacity:
                  !!authUser &&
                  !authUser.permissions.includes("USER_CHANGE_ROLE")
                    ? 0.5
                    : 1,
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          }
        />
      )}
    </div>
  );
};

export default UserRoleChanger;
