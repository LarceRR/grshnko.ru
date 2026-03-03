import { Tabs } from "antd";
import { getPageHeaderIcon } from "../../../../config/route-icons";
import GroupPermissionsTab from "./tabs/GroupPermissionsTab";
import UserPermissionsTab from "./tabs/UserPermissionsTab";
import InheritanceTab from "./tabs/InheritanceTab";
import "./PermissionsPage.scss";

const PermissionsPage = () => {
  const icon = getPageHeaderIcon("/system/permissions");
  return (
    <div className="permissions-page">
      <div className="page-header__title">
        {icon}
        <h2>Управление правами</h2>
      </div>
      <Tabs
        defaultActiveKey="groups"
        items={[
          {
            key: "groups",
            label: "Права групп",
            children: <GroupPermissionsTab />,
          },
          {
            key: "users",
            label: "Права пользователей",
            children: <UserPermissionsTab />,
          },
          {
            key: "inheritance",
            label: "Наследование групп",
            children: <InheritanceTab />,
          },
        ]}
      />
    </div>
  );
};

export default PermissionsPage;
