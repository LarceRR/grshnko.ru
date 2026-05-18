import { useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Input, Switch, Button, Popconfirm } from "antd";
import { Edit, Trash2 } from "lucide-react";
import {
  createCorsOrigin,
  deleteCorsOrigin,
  getCorsOrigins,
  updateCorsOrigin,
} from "../../../../api/corsOrigins";
import { getPageHeaderIcon } from "../../../../config/route-icons";
import { useNotify } from "../../../../hooks/useNotify";
import { useUser } from "../../../../hooks/useUser";
import type {
  CorsOrigin,
  CreateCorsOriginBody,
} from "../../../../types/corsOrigin";
import "./CorsOriginsPage.scss";

const QUERY_KEY = ["cors-origins"] as const;

function emptyForm(): CreateCorsOriginBody {
  return { origin: "", label: "", enabled: true };
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export default function CorsOriginsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const isAdmin = user?.role?.key === "ADMIN";
  const page = useCorsOriginsPageState(isAdmin);

  if (isUserLoading) return <div>Загрузка…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  if (page.isLoading) return <div>Загрузка…</div>;
  if (page.isError) return <div>Нет доступа или ошибка загрузки</div>;

  return <CorsOriginsPageView {...page} />;
}

function useCorsOriginsPageState(enabled: boolean) {
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CorsOrigin | null>(null);
  const [formData, setFormData] = useState<CreateCorsOriginBody>(emptyForm());
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getCorsOrigins, retry: false, enabled });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  return {
    contextHolder,
    origins: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    modal: { isModalOpen, setIsModalOpen, editing, setEditing, formData, setFormData },
    actions: createActions({ invalidate, notify, setIsModalOpen, setEditing, setFormData }),
  };
}

function createActions(deps: ActionDeps) {
  return {
    openCreate: () => openCreate(deps),
    openEdit: (row: CorsOrigin, modal: ModalState) => openEdit(row, modal),
    closeModal: (modal: ModalState) => closeModal(modal),
    submit: (modal: ModalState) => submit(modal, deps),
    toggleEnabled: (row: CorsOrigin) => toggleEnabled(row, deps),
    remove: (id: string) => remove(id, deps),
  };
}

function CorsOriginsPageView(props: PageState) {
  const headerIcon = getPageHeaderIcon("/system/cors-origins");
  return (
    <div className="cors-origins-page">
      {props.contextHolder}
      <div className="cors-origins-header">
        <div className="page-header__title">
          {headerIcon}
          <h2>CORS Origins</h2>
        </div>
        <Button type="primary" onClick={props.actions.openCreate}>
          Добавить origin
        </Button>
      </div>
      <CorsOriginsIntro />
      <CorsOriginsList origins={props.origins} modal={props.modal} actions={props.actions} />
      <CorsOriginModal modal={props.modal} actions={props.actions} />
    </div>
  );
}

function CorsOriginsIntro() {
  return (
    <p className="cors-origins-intro">
      Управление списком разрешённых значений заголовка Origin для браузерных
      запросов в production. Изменения применяются сразу, без перезапуска.
      Wildcard и IP-адреса не используются — только явные http/https origins.
    </p>
  );
}

function CorsOriginsList(props: ListProps) {
  if (props.origins.length === 0) {
    return <div className="cors-origins-list"><div className="empty-state">Список пуст.</div></div>;
  }
  return (
    <div className="cors-origins-list">
      {props.origins.map((row) => (
        <CorsOriginRow key={row.id} row={row} modal={props.modal} actions={props.actions} />
      ))}
    </div>
  );
}

function CorsOriginRow({ row, modal, actions }: RowProps) {
  return (
    <div className="cors-origin-item">
      <div className="cors-origin-main">
        <div className="cors-origin-value">{row.origin}</div>
        {row.label ? <div className="cors-origin-label">{row.label}</div> : null}
        <div className="cors-origin-meta">
          <span className={`cors-origin-status ${row.enabled ? "enabled" : "disabled"}`}>
            {row.enabled ? "Включён" : "Отключён"}
          </span>
        </div>
      </div>
      <CorsOriginActions row={row} modal={modal} actions={actions} />
    </div>
  );
}

function CorsOriginActions({ row, modal, actions }: RowProps) {
  return (
    <div className="cors-origin-actions">
      <Switch checked={row.enabled} onChange={() => actions.toggleEnabled(row)} />
      <button type="button" className="action-button edit-button" onClick={() => actions.openEdit(row, modal)}>
        <Edit size={18} />
      </button>
      <Popconfirm title="Удалить origin?" description="Браузерные запросы с этого Origin будут отклонены." onConfirm={() => actions.remove(row.id)} okText="Удалить" cancelText="Отмена" okButtonProps={{ danger: true }}>
        <button type="button" className="action-button delete-button">
          <Trash2 size={18} />
        </button>
      </Popconfirm>
    </div>
  );
}

function CorsOriginModal({ modal, actions }: ModalProps) {
  return (
    <Modal open={modal.isModalOpen} onCancel={() => actions.closeModal(modal)} onOk={() => actions.submit(modal)} title={modal.editing ? "Редактировать origin" : "Добавить origin"} okText={modal.editing ? "Сохранить" : "Добавить"} cancelText="Отмена" destroyOnClose>
      <div className="cors-origin-form">
        <div className="form-item">
          <label>Origin *</label>
          <Input value={modal.formData.origin} onChange={(e) => modal.setFormData({ ...modal.formData, origin: e.target.value })} placeholder="https://example.com или http://tauri.localhost" />
        </div>
        <div className="form-item">
          <label>Метка</label>
          <Input value={modal.formData.label} onChange={(e) => modal.setFormData({ ...modal.formData, label: e.target.value })} placeholder="Например: Production web" />
        </div>
        <div className="form-item">
          <label>
            <Switch checked={modal.formData.enabled ?? true} onChange={(enabled) => modal.setFormData({ ...modal.formData, enabled })} />
            <span style={{ marginLeft: 8 }}>Включён</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

function openCreate(deps: ActionDeps): void {
  deps.setEditing(null);
  deps.setFormData(emptyForm());
  deps.setIsModalOpen(true);
}

function openEdit(row: CorsOrigin, modal: ModalState): void {
  modal.setEditing(row);
  modal.setFormData({ origin: row.origin, label: row.label ?? "", enabled: row.enabled });
  modal.setIsModalOpen(true);
}

function closeModal(modal: ModalState): void {
  modal.setIsModalOpen(false);
  modal.setEditing(null);
  modal.setFormData(emptyForm());
}

async function submit(modal: ModalState, deps: ActionDeps): Promise<void> {
  try {
    const saved = modal.editing
      ? await updateCorsOrigin(modal.editing.id, modal.formData)
      : await createCorsOrigin(modal.formData);
    deps.notify({ title: "Origin сохранён", body: saved.origin, type: "success" });
    await deps.invalidate();
    closeModal(modal);
  } catch (e: unknown) {
    deps.notify({ title: "Ошибка", body: errorMessage(e, "Ошибка операции"), type: "error" });
  }
}

async function toggleEnabled(row: CorsOrigin, deps: ActionDeps): Promise<void> {
  try {
    await updateCorsOrigin(row.id, { enabled: !row.enabled });
    await deps.invalidate();
  } catch (e: unknown) {
    deps.notify({ title: "Ошибка", body: errorMessage(e, "Ошибка"), type: "error" });
  }
}

async function remove(id: string, deps: ActionDeps): Promise<void> {
  try {
    await deleteCorsOrigin(id);
    await deps.invalidate();
    deps.notify({ title: "Origin удалён", body: "", type: "success" });
  } catch (e: unknown) {
    deps.notify({ title: "Ошибка", body: errorMessage(e, "Ошибка удаления"), type: "error" });
  }
}

type Notify = ReturnType<typeof useNotify>["notify"];

interface ActionDeps {
  invalidate: () => Promise<unknown>;
  notify: Notify;
  setIsModalOpen: (value: boolean) => void;
  setEditing: (value: CorsOrigin | null) => void;
  setFormData: (value: CreateCorsOriginBody) => void;
}

interface ModalState {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  editing: CorsOrigin | null;
  setEditing: (value: CorsOrigin | null) => void;
  formData: CreateCorsOriginBody;
  setFormData: (value: CreateCorsOriginBody) => void;
}

type Actions = ReturnType<typeof createActions>;

interface PageState {
  contextHolder: ReactNode;
  origins: CorsOrigin[];
  isLoading: boolean;
  isError: boolean;
  modal: ModalState;
  actions: Actions;
}

interface ListProps {
  origins: CorsOrigin[];
  modal: ModalState;
  actions: Actions;
}

interface RowProps {
  row: CorsOrigin;
  modal: ModalState;
  actions: Actions;
}

interface ModalProps {
  modal: ModalState;
  actions: Actions;
}
