import axios from "axios";
import { API_URL } from "../config";
import {
  Role,
  PermissionDef,
  GroupPermissionEntry,
  EffectiveGroupPermissionEntry,
  UserPermissionEntry,
  RoleInheritanceEntry,
} from "../types/permission";

export const getRoles = async (): Promise<Role[]> => {
  const res = await axios.get<Role[]>(`${API_URL}api/permissions/roles`, {
    withCredentials: true,
  });
  return res.data;
};

export const getAllPermissions = async (): Promise<PermissionDef[]> => {
  const res = await axios.get<PermissionDef[]>(
    `${API_URL}api/permissions/all`,
    { withCredentials: true },
  );
  return res.data;
};

export const getGroupPermissions = async (
  roleId: string,
): Promise<GroupPermissionEntry[]> => {
  const res = await axios.get<GroupPermissionEntry[]>(
    `${API_URL}api/permissions/groups/${roleId}`,
    { withCredentials: true },
  );
  return res.data;
};

export const getEffectiveGroupPermissions = async (
  roleId: string,
): Promise<EffectiveGroupPermissionEntry[]> => {
  const res = await axios.get<EffectiveGroupPermissionEntry[]>(
    `${API_URL}api/permissions/groups/${roleId}/effective`,
    { withCredentials: true },
  );
  return res.data;
};

export const updateGroupPermissions = async (
  roleId: string,
  permissions: { permissionId: string; value: boolean }[],
): Promise<void> => {
  await axios.put(
    `${API_URL}api/permissions/groups/${roleId}`,
    { permissions },
    { withCredentials: true },
  );
};

export const getUserPermissions = async (
  userId: string,
): Promise<UserPermissionEntry[]> => {
  const res = await axios.get<UserPermissionEntry[]>(
    `${API_URL}api/permissions/users/${userId}`,
    { withCredentials: true },
  );
  return res.data;
};

export const updateUserPermissions = async (
  userId: string,
  permissions: { permissionId: string; value: boolean | null }[],
): Promise<void> => {
  await axios.put(
    `${API_URL}api/permissions/users/${userId}`,
    { permissions },
    { withCredentials: true },
  );
};

export const getInheritance = async (): Promise<RoleInheritanceEntry[]> => {
  const res = await axios.get<RoleInheritanceEntry[]>(
    `${API_URL}api/permissions/inheritance`,
    { withCredentials: true },
  );
  return res.data;
};

export const updateInheritance = async (
  links: { parentRoleId: string; childRoleId: string }[],
): Promise<void> => {
  await axios.put(
    `${API_URL}api/permissions/inheritance`,
    { links },
    { withCredentials: true },
  );
};
