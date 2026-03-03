import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, Button, message, Spin } from "antd";
import { ArrowRight, Trash2 } from "lucide-react";
import {
  getRoles,
  getInheritance,
  updateInheritance,
} from "../../../../../api/permission";
import type { RoleInheritanceEntry } from "../../../../../types/permission";

const InheritanceTab = () => {
  const queryClient = useQueryClient();
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newChildId, setNewChildId] = useState<string | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["permissions-roles"],
    queryFn: getRoles,
  });

  const { data: inheritance = [], isLoading } = useQuery({
    queryKey: ["permissions-inheritance"],
    queryFn: getInheritance,
  });

  const saveMutation = useMutation({
    mutationFn: (links: { parentRoleId: string; childRoleId: string }[]) =>
      updateInheritance(links),
    onSuccess: () => {
      message.success("Наследование сохранено");
      queryClient.invalidateQueries({
        queryKey: ["permissions-inheritance"],
      });
    },
    onError: () => {
      message.error("Ошибка сохранения");
    },
  });

  const handleRemove = (entry: RoleInheritanceEntry) => {
    const remaining = inheritance
      .filter((e) => e.id !== entry.id)
      .map((e) => ({
        parentRoleId: e.parentRoleId,
        childRoleId: e.childRoleId,
      }));
    saveMutation.mutate(remaining);
  };

  const handleAdd = () => {
    if (!newParentId || !newChildId) return;
    if (newParentId === newChildId) {
      message.warning("Нельзя наследовать от самого себя");
      return;
    }
    const exists = inheritance.some(
      (e) => e.parentRoleId === newParentId && e.childRoleId === newChildId,
    );
    if (exists) {
      message.warning("Такая связь уже существует");
      return;
    }
    const links = [
      ...inheritance.map((e) => ({
        parentRoleId: e.parentRoleId,
        childRoleId: e.childRoleId,
      })),
      { parentRoleId: newParentId, childRoleId: newChildId },
    ];
    saveMutation.mutate(links);
    setNewParentId(null);
    setNewChildId(null);
  };

  const roleSelectOptions = roles.map((r) => ({
    value: r.id,
    label: (
      <span>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: r.color ?? "var(--text-secondary)",
            marginRight: 8,
          }}
        />
        {r.name}
      </span>
    ),
  }));

  if (isLoading) return <Spin />;

  return (
    <div className="inheritance-section">
      <div className="inheritance-help">
        <p>Настройте, какие роли наследуют права от других ролей.</p>
        <p>
          <strong>Источник прав</strong> — роль, чьи права будут унаследованы.
          <br />
          <strong>Наследник</strong> — роль, которая получит все права источника
          в дополнение к своим собственным.
        </p>
        <p>
          Наследование транзитивно: если <em>Пользователь</em> является
          источником для <em>Премиум</em>, а <em>Премиум</em> — источником для{" "}
          <em>Модератор</em>, то <em>Модератор</em> получит права обеих ролей.
        </p>
      </div>

      {inheritance.map((entry) => (
        <div key={entry.id} className="inheritance-card">
          <span
            className="role-badge"
            style={{
              backgroundColor:
                entry.parentRole.color ?? "var(--text-secondary)",
            }}
          >
            {entry.parentRole.name}
          </span>
          <span className="inheritance-label">источник прав для</span>
          <ArrowRight className="inheritance-arrow" size={18} />
          <span
            className="role-badge"
            style={{
              backgroundColor: entry.childRole.color ?? "var(--text-secondary)",
            }}
          >
            {entry.childRole.name}
          </span>
          <div className="inheritance-actions">
            <Button
              type="text"
              icon={<Trash2 size={16} />}
              className="inheritance-delete-btn"
              onClick={() => handleRemove(entry)}
              loading={saveMutation.isPending}
            />
          </div>
        </div>
      ))}

      {inheritance.length === 0 && (
        <div className="empty-state">
          Нет настроенных связей наследования. Добавьте первую ниже.
        </div>
      )}

      <div className="add-inheritance-form">
        <span className="form-label">Источник прав:</span>
        <Select
          placeholder="Выберите роль"
          style={{ width: 200 }}
          value={newParentId}
          onChange={setNewParentId}
          options={roleSelectOptions}
          allowClear
        />
        <ArrowRight
          size={18}
          style={{ color: "var(--text-secondary)", flexShrink: 0 }}
        />
        <span className="form-label">Наследник:</span>
        <Select
          placeholder="Выберите роль"
          style={{ width: 200 }}
          value={newChildId}
          onChange={setNewChildId}
          options={roleSelectOptions}
          allowClear
        />
        <Button
          type="primary"
          disabled={!newParentId || !newChildId}
          loading={saveMutation.isPending}
          onClick={handleAdd}
        >
          Добавить
        </Button>
      </div>
    </div>
  );
};

export default InheritanceTab;
