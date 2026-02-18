import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Input, Switch, Button, Popconfirm } from "antd";
import {
  getLLMModels,
  createLLMModel,
  updateLLMModel,
  deleteLLMModel,
} from "../../../../api/llmModels";
import type { LLMModel, CreateLLMModelBody } from "../../../../types/llmModel";
import { useNotify } from "../../../../hooks/useNotify";
import { Edit, Trash2 } from "lucide-react";
import "./LLMModelsPage.scss";

export default function LLMModelsPage() {
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [formData, setFormData] = useState<CreateLLMModelBody>({
    modelId: "",
    displayName: "",
    isActive: true,
    isFree: true,
  });

  const {
    data: models = [],
    isLoading,
    isError,
  } = useQuery<LLMModel[]>({
    queryKey: ["llm-models"],
    queryFn: getLLMModels,
    retry: false,
  });

  const handleOpenCreate = () => {
    setEditingModel(null);
    setFormData({
      modelId: "",
      displayName: "",
      isActive: true,
      isFree: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (model: LLMModel) => {
    setEditingModel(model);
    setFormData({
      modelId: model.modelId,
      displayName: model.displayName || "",
      isActive: model.isActive ?? true,
      isFree: model.isFree ?? true,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
    setFormData({
      modelId: "",
      displayName: "",
      isActive: true,
      isFree: true,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingModel) {
        await updateLLMModel(editingModel._id, formData);
        notify({
          title: "Модель обновлена",
          body: `Модель ${formData.modelId} успешно обновлена`,
          type: "success",
        });
      } else {
        await createLLMModel(formData);
        notify({
          title: "Модель создана",
          body: `Модель ${formData.modelId} успешно создана`,
          type: "success",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["llm-models"] });
      handleCloseModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка операции";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLLMModel(id);
      await queryClient.invalidateQueries({ queryKey: ["llm-models"] });
      notify({ title: "Модель удалена", body: "", type: "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка удаления";
      notify({ title: "Ошибка", body: msg, type: "error" });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ru-RU");
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  if (isLoading) return <div>Загрузка моделей...</div>;
  if (isError) return <div>Ошибка при загрузке моделей</div>;

  return (
    <div className="llm-models-page">
      {contextHolder}
      <div className="llm-models-header">
        <h2>Управление LLM моделями</h2>
        <Button type="primary" onClick={handleOpenCreate}>
          Создать модель
        </Button>
      </div>

      <div className="llm-models-list">
        {models.length === 0 ? (
          <div className="empty-state">
            Моделей пока нет. Создайте первую модель.
          </div>
        ) : (
          models.map((model) => (
            <div key={model._id} className="llm-model-item">
              <div className="llm-model-content">
                <div className="llm-model-main">
                  <div className="llm-model-id">{model.modelId}</div>
                  {model.displayName && (
                    <div className="llm-model-display-name">
                      {model.displayName}
                    </div>
                  )}
                  <div className="llm-model-meta">
                    <span
                      className={`llm-model-status ${model.isActive ? "active" : "inactive"}`}
                    >
                      {model.isActive ? "Активна" : "Неактивна"}
                    </span>
                    <span
                      className={`llm-model-free ${model.isFree ? "free" : "paid"}`}
                    >
                      {model.isFree ? "Бесплатная" : "Платная"}
                    </span>
                  </div>
                </div>
                <div className="llm-model-stats">
                  <div className="stat-item">
                    <span className="stat-label">Использований:</span>
                    <span className="stat-value">
                      {formatNumber(model.totalUsage)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Успешных:</span>
                    <span className="stat-value">
                      {formatNumber(model.successCount)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Ошибок:</span>
                    <span className="stat-value">
                      {formatNumber(model.failureCount)}
                    </span>
                  </div>
                  {model.lastUsedAt && (
                    <div className="stat-item">
                      <span className="stat-label">
                        Последнее использование:
                      </span>
                      <span className="stat-value">
                        {formatDate(model.lastUsedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="llm-model-actions">
                <button
                  className="action-button edit-button"
                  onClick={() => handleOpenEdit(model)}
                  title="Редактировать"
                >
                  <Edit size={18} />
                </button>
                <Popconfirm
                  title="Удалить модель?"
                  description="Удаление нельзя отменить."
                  onConfirm={() => handleDelete(model._id)}
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    className="action-button delete-button"
                    title="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        title={editingModel ? "Редактировать модель" : "Создать модель"}
        okText={editingModel ? "Сохранить" : "Создать"}
        cancelText="Отмена"
        destroyOnClose
      >
        <div className="llm-model-form">
          <div className="form-item">
            <label>Model ID *</label>
            <Input
              value={formData.modelId}
              onChange={(e) =>
                setFormData({ ...formData, modelId: e.target.value })
              }
              placeholder="например: deepseek/deepseek-chat-v3-0324:free"
            />
          </div>
          <div className="form-item">
            <label>Отображаемое имя</label>
            <Input
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              placeholder="Например: DeepSeek Chat V3"
            />
          </div>
          <div className="form-item">
            <label>
              <Switch
                checked={formData.isActive}
                onChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <span style={{ marginLeft: 8 }}>Активна</span>
            </label>
          </div>
          <div className="form-item">
            <label>
              <Switch
                checked={formData.isFree}
                onChange={(checked) =>
                  setFormData({ ...formData, isFree: checked })
                }
              />
              <span style={{ marginLeft: 8 }}>Бесплатная</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
