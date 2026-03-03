import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, Button, message, Spin, Tag } from "antd";
import { Plus, Trash2 } from "lucide-react";
import {
  getAllPermissions,
  getUserPermissions,
  updateUserPermissions,
  getRoles,
  getEffectiveGroupPermissions,
} from "../../../../../api/permission";
import { getAllUsers, getUser } from "../../../../../api/user";
import type { User } from "../../../../../types/user";
import type { PermissionDef } from "../../../../../types/permission";

type OverrideValue = true | false | null;

const UserPermissionsTab = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, OverrideValue>
  >({});
  const [dirty, setDirty] = useState(false);

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["usersList"],
    queryFn: () => getAllUsers() as Promise<User[]>,
  });

  useEffect(() => {
    if (!selectedUserId && currentUser?.id) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser, selectedUserId]);

  const { data: allPerms = [] } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: getAllPermissions,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["permissions-roles"],
    queryFn: getRoles,
  });

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId],
  );

  const userRoleId = useMemo(() => {
    if (!selectedUser?.role) return null;
    return roles.find((r) => r.key === selectedUser.role?.key)?.id ?? null;
  }, [selectedUser, roles]);

  const { data: userPerms, isLoading: loadingUser } = useQuery({
    queryKey: ["user-permissions", selectedUserId],
    queryFn: () => getUserPermissions(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const { data: groupPerms } = useQuery({
    queryKey: ["effective-group-permissions", userRoleId],
    queryFn: () => getEffectiveGroupPermissions(userRoleId!),
    enabled: !!userRoleId,
  });

  const groupMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    groupPerms?.forEach((gp) => {
      m[gp.permissionId] = gp.value;
    });
    return m;
  }, [groupPerms]);

  const userOverrideMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    userPerms?.forEach((up) => {
      m[up.permissionId] = up.value;
    });
    return m;
  }, [userPerms]);

  const getEffectiveState = useCallback(
    (permId: string): OverrideValue => {
      if (permId in localOverrides) return localOverrides[permId];
      if (permId in userOverrideMap)
        return userOverrideMap[permId] ? true : false;
      return null;
    },
    [localOverrides, userOverrideMap],
  );

  // Permissions the user actually has (group allow + user overrides)
  const visiblePermIds = useMemo(() => {
    const ids = new Set<string>();

    for (const [permId, val] of Object.entries(groupMap)) {
      if (val) ids.add(permId);
    }
    for (const [permId] of Object.entries(userOverrideMap)) {
      ids.add(permId);
    }
    for (const [permId, val] of Object.entries(localOverrides)) {
      if (val !== null) ids.add(permId);
      else if (!(permId in userOverrideMap) && !groupMap[permId])
        ids.delete(permId);
    }

    return ids;
  }, [groupMap, userOverrideMap, localOverrides]);

  const visiblePerms = useMemo(
    () => allPerms.filter((p) => visiblePermIds.has(p.id)),
    [allPerms, visiblePermIds],
  );

  // Permissions available to add (not yet visible)
  const addablePerms = useMemo(
    () => allPerms.filter((p) => !visiblePermIds.has(p.id)),
    [allPerms, visiblePermIds],
  );

  const cycleState = useCallback(
    (permId: string) => {
      const current = getEffectiveState(permId);
      let next: OverrideValue;
      if (current === null) next = true;
      else if (current === true) next = false;
      else next = null;
      setLocalOverrides((prev) => ({ ...prev, [permId]: next }));
      setDirty(true);
    },
    [getEffectiveState],
  );

  const handleAddPermission = useCallback((permId: string) => {
    setLocalOverrides((prev) => ({ ...prev, [permId]: true }));
    setDirty(true);
  }, []);

  const handleRemoveOverride = useCallback((permId: string) => {
    setLocalOverrides((prev) => ({ ...prev, [permId]: null }));
    setDirty(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => {
      const merged: Record<string, OverrideValue> = { ...userOverrideMap };
      for (const [k, v] of Object.entries(localOverrides)) {
        merged[k] = v;
      }
      const permissions = Object.entries(merged)
        .filter(([, v]) => v !== undefined)
        .map(([permissionId, value]) => ({ permissionId, value }));
      return updateUserPermissions(selectedUserId!, permissions);
    },
    onSuccess: () => {
      message.success("Права пользователя сохранены");
      setLocalOverrides({});
      setDirty(false);
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", selectedUserId],
      });
    },
    onError: () => {
      message.error("Ошибка сохранения");
    },
  });

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setLocalOverrides({});
    setDirty(false);
  };

  return (
    <div className="user-perm-section">
      <div className="tab-toolbar">
        <Select
          showSearch
          placeholder="Выберите пользователя"
          style={{ width: 300 }}
          value={selectedUserId}
          onChange={handleUserChange}
          filterOption={(input, option) =>
            (option?.searchLabel as string)
              ?.toLowerCase()
              .includes(input.toLowerCase()) ?? false
          }
          options={users.map((u) => ({
            value: u.id,
            searchLabel: `${u.username} ${u.firstName ?? ""} ${u.lastName ?? ""}`,
            label: (
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {u.username}
                  {u.firstName ? ` (${u.firstName})` : ""}
                </span>
                {u.id === currentUser?.id && (
                  <span
                    style={{
                      opacity: 0.4,
                      fontSize: 12,
                      marginRight: 14,
                      marginBottom: 3,
                    }}
                  >
                    Вы
                  </span>
                )}
              </span>
            ),
          }))}
        />
        {dirty && (
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Сохранить
          </Button>
        )}
      </div>

      {selectedUser && (
        <div className="user-info-card">
          <strong>{selectedUser.username}</strong>
          {selectedUser.role && (
            <span
              className="user-role-badge"
              style={{ backgroundColor: selectedUser.role.color ?? "#888" }}
            >
              {selectedUser.role.name}
            </span>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="override-legend">
          <span>
            <Tag color="green">Allow</Tag> — разрешено
          </span>
          <span>
            <Tag color="red">Deny</Tag> — запрещено (override)
          </span>
          <span>
            <Tag color="blue">Group</Tag> — от группы
          </span>
          <span>
            <Tag color="purple">Override</Tag> — персональное
          </span>
        </div>
      )}

      {selectedUserId && loadingUser && <Spin />}

      {selectedUserId && !loadingUser && (
        <>
          <div className="tab-toolbar">
            <Select
              key={visiblePermIds.size}
              showSearch
              placeholder="Добавить право..."
              style={{ width: 400 }}
              value={null}
              onChange={handleAddPermission}
              filterOption={(input, option) =>
                (option?.searchLabel as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase()) ?? false
              }
              options={addablePerms
                .filter((p) => !visiblePermIds.has(p.id))
                .map((p) => ({
                  value: p.id,
                  searchLabel: `${p.name} ${p.description ?? ""}`,
                  label: (
                    <span>
                      <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                        {p.name}
                      </span>
                      {p.description && (
                        <span
                          style={{
                            marginLeft: 8,
                            color: "var(--text-secondary)",
                            fontSize: 12,
                          }}
                        >
                          {p.description}
                        </span>
                      )}
                    </span>
                  ),
                }))}
              suffixIcon={<Plus size={14} />}
            />
          </div>

          {visiblePerms.length > 0 ? (
            <div className="perm-matrix">
              <table>
                <thead>
                  <tr>
                    <th>Право</th>
                    <th style={{ width: 100, textAlign: "center" }}>
                      Источник
                    </th>
                    <th style={{ width: 100, textAlign: "center" }}>Статус</th>
                    <th style={{ width: 50, textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePerms.map((p) => {
                    const overrideState = getEffectiveState(p.id);
                    const fromGroup = !!groupMap[p.id];
                    const hasOverride = overrideState !== null;

                    return (
                      <UserPermRow
                        key={p.id}
                        perm={p}
                        fromGroup={fromGroup}
                        overrideState={overrideState}
                        onCycle={() => cycleState(p.id)}
                        onRemove={
                          hasOverride
                            ? () => handleRemoveOverride(p.id)
                            : undefined
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              У пользователя нет назначенных прав. Используйте поиск выше, чтобы
              добавить.
            </div>
          )}
        </>
      )}

      {!selectedUserId && (
        <div className="empty-state">
          Выберите пользователя для управления персональными правами
        </div>
      )}
    </div>
  );
};

const UserPermRow = ({
  perm,
  fromGroup,
  overrideState,
  onCycle,
  onRemove,
}: {
  perm: PermissionDef;
  fromGroup: boolean;
  overrideState: OverrideValue;
  onCycle: () => void;
  onRemove?: () => void;
}) => {
  const source =
    overrideState !== null ? (
      <Tag color="purple">Override</Tag>
    ) : fromGroup ? (
      <Tag color="blue">Group</Tag>
    ) : (
      <Tag>—</Tag>
    );

  const effectiveAllowed = overrideState !== null ? overrideState : fromGroup;

  const statusTag = effectiveAllowed ? (
    <Tag color="green" style={{ cursor: "pointer" }} onClick={onCycle}>
      Allow
    </Tag>
  ) : (
    <Tag color="red" style={{ cursor: "pointer" }} onClick={onCycle}>
      Deny
    </Tag>
  );

  return (
    <tr>
      <td>
        <div className="perm-name">{perm.name}</div>
        {perm.description && (
          <div className="perm-desc">{perm.description}</div>
        )}
      </td>
      <td style={{ textAlign: "center" }}>{source}</td>
      <td style={{ textAlign: "center" }}>{statusTag}</td>
      <td style={{ textAlign: "center" }}>
        {onRemove && (
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={onRemove}
          />
        )}
      </td>
    </tr>
  );
};

export default UserPermissionsTab;
