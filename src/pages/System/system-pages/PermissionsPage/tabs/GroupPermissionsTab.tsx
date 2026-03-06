import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, Button, Switch, message, Spin } from "antd";
import { ChevronRight } from "lucide-react";
import {
  getRoles,
  getAllPermissions,
  getGroupPermissions,
  updateGroupPermissions,
} from "../../../../../api/permission";
import type { PermissionDef } from "../../../../../types/permission";

function categorize(name: string): string {
  const parts = name.split("_");
  return parts.length > 1 ? parts[0] : name;
}

function groupByCategory(perms: PermissionDef[]) {
  const map = new Map<string, PermissionDef[]>();
  for (const p of perms) {
    const cat = categorize(p.name);
    const arr = map.get(cat) ?? [];
    arr.push(p);
    map.set(cat, arr);
  }
  return map;
}

const GroupPermissionsTab = () => {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["permissions-roles"],
    queryFn: getRoles,
  });

  const { data: allPerms = [] } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: getAllPermissions,
  });

  const { data: groupPerms, isLoading: loadingGroup } = useQuery({
    queryKey: ["group-permissions", selectedRoleId],
    queryFn: () => getGroupPermissions(selectedRoleId!),
    enabled: !!selectedRoleId,
  });

  const grouped = useMemo(() => groupByCategory(allPerms), [allPerms]);

  const valueMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    groupPerms?.forEach((gp) => {
      m[gp.permissionId] = gp.value;
    });
    return { ...m, ...localValues };
  }, [groupPerms, localValues]);

  const handleToggle = useCallback((permissionId: string, checked: boolean) => {
    setLocalValues((prev) => ({ ...prev, [permissionId]: checked }));
    setDirty(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => {
      const permissions = Object.entries(valueMap).map(
        ([permissionId, value]) => ({ permissionId, value }),
      );
      return updateGroupPermissions(selectedRoleId!, permissions);
    },
    onSuccess: () => {
      message.success("Права группы сохранены");
      setLocalValues({});
      setDirty(false);
      queryClient.invalidateQueries({
        queryKey: ["group-permissions", selectedRoleId],
      });
    },
    onError: () => {
      message.error("Ошибка сохранения");
    },
  });

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    setLocalValues({});
    setDirty(false);
    setExpandedCategory(null);
  };

  const handleCategoryClick = useCallback((category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  }, []);

  return (
    <div>
      <div className="tab-toolbar">
        <Select
          placeholder="Выберите группу (роль)"
          style={{ width: 240 }}
          value={selectedRoleId}
          onChange={handleRoleChange}
          options={roles.map((r) => ({
            value: r.id,
            label: (
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: r.color ?? "#888",
                    marginRight: 8,
                  }}
                />
                {r.name} ({r.key})
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

      {selectedRoleId && loadingGroup && <Spin />}

      {selectedRoleId && !loadingGroup && (
        <div className="perm-accordion">
          {[...grouped.entries()].map(([category, perms]) => (
            <CategoryBlock
              key={category}
              category={category}
              permissions={perms}
              valueMap={valueMap}
              onToggle={handleToggle}
              isExpanded={expandedCategory === category}
              onHeaderClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>
      )}

      {!selectedRoleId && (
        <div className="empty-state">
          Выберите группу для просмотра и редактирования прав
        </div>
      )}
    </div>
  );
};

const CategoryBlock = ({
  category,
  permissions,
  valueMap,
  onToggle,
  isExpanded,
  onHeaderClick,
}: {
  category: string;
  permissions: PermissionDef[];
  valueMap: Record<string, boolean>;
  onToggle: (id: string, val: boolean) => void;
  isExpanded: boolean;
  onHeaderClick: () => void;
}) => {
  const enabledCount = permissions.filter((p) => !!valueMap[p.id]).length;
  const total = permissions.length;

  return (
    <div className="perm-category-block">
      <div
        className="perm-category-header"
        onClick={onHeaderClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onHeaderClick()}
      >
        <span className="perm-category-name">{category}</span>
        <span className="perm-category-count">
          {enabledCount}/{total}
        </span>
        <ChevronRight
          size={18}
          className={`perm-category-chevron ${isExpanded ? "expanded" : ""}`}
        />
      </div>
      {isExpanded && (
        <div className="perm-category-content">
          <table>
            <thead>
              <tr>
                <th>Право</th>
                <th style={{ width: 80, textAlign: "center" }}>Разрешено</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="perm-name">{p.name}</div>
                    {p.description && (
                      <div className="perm-desc">{p.description}</div>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Switch
                      size="small"
                      checked={!!valueMap[p.id]}
                      onChange={(checked) => onToggle(p.id, checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GroupPermissionsTab;
