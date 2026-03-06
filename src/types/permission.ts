export interface Role {
  id: string;
  key: string;
  name: string;
  color?: string;
}

export interface PermissionDef {
  id: string;
  name: string;
  description?: string;
}

export interface GroupPermissionEntry {
  permissionId: string;
  permissionName: string;
  description?: string;
  value: boolean;
}

export interface UserPermissionEntry {
  id: string;
  permissionId: string;
  permissionName: string;
  description?: string;
  value: boolean;
}

export interface RoleInheritanceEntry {
  id: string;
  parentRoleId: string;
  childRoleId: string;
  parentRole: { key: string; name: string; color?: string };
  childRole: { key: string; name: string; color?: string };
}
