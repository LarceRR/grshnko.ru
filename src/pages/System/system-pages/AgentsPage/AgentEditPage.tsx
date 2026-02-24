import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Button, Popconfirm, Select, InputNumber, Switch, Typography, Breadcrumb, Card, Space } from "antd";
import { chatApi } from "../../../../api/chat";
import type { ChatAgent } from "../../../../types/chat.types";
import { useNotify } from "../../../../hooks/useNotify";
import { Save, Trash2, ArrowLeft, Bot } from "lucide-react";
import "./AgentsPage.scss";
import { useWindowSize } from "../../../../hooks/useWindowSize";

const { TextArea } = Input;
const { Title } = Typography;

export default function AgentEditPage() {
  const { size } = useWindowSize();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useNotify();
  const isNew = id === "new";

  const [formData, setFormData] = useState<Partial<ChatAgent>>({
    name: "",
    description: "",
    systemPrompt: "",
    tools: [],
    preferredModel: "",
    temperature: 0.1,
    maxTokens: 4000,
    welcomeMessage: "",
    avatar: "",
    labels: [],
    isPublic: false,
  });

  const { data: agentData, isLoading: isAgentLoading } = useQuery({
    queryKey: ["chat", "agent", id],
    queryFn: () => chatApi.getAgent(id!),
    enabled: !!id && !isNew,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ["chat", "tools"],
    queryFn: () => chatApi.getTools().then(r => r.data),
  });

  const { data: models = [] } = useQuery({
    queryKey: ["chat", "models"],
    queryFn: () => chatApi.getModels().then(r => r.data),
  });

  useEffect(() => {
    if (agentData?.data) {
      const agent = agentData.data;
      setFormData({
        ...agent,
        tools: agent.tools || [],
        labels: agent.labels || [],
      });
    }
  }, [agentData]);

  useEffect(() => {
    if (isNew && models.length > 0 && !formData.preferredModel) {
      setFormData(prev => ({ ...prev, preferredModel: models[0].modelId }));
    }
  }, [isNew, models]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.systemPrompt) {
      notify({ title: "Ошибка", body: "Имя и системный промпт обязательны", type: "error" });
      return;
    }

    try {
      if (!isNew && id) {
        await chatApi.updateAgent(id, formData);
        notify({ title: "Агент обновлен", body: `Изменения сохранены`, type: "success" });
      } else {
        const res = await chatApi.createAgent(formData);
        notify({ title: "Агент создан", body: `Агент успешно создан`, type: "success" });
        navigate(`/system/agents/${res.data.id}`, { replace: true });
      }
      queryClient.invalidateQueries({ queryKey: ["chat", "agents"] });
    } catch (e: any) {
      notify({ title: "Ошибка", body: e.response?.data?.message || "Ошибка сохранения", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    try {
      await chatApi.deleteAgent(id);
      queryClient.invalidateQueries({ queryKey: ["chat", "agents"] });
      notify({ title: "Агент удален", body: "", type: "success" });
      navigate("/system/agents");
    } catch (e: any) {
      notify({ title: "Ошибка", body: e.response?.data?.message || "Ошибка удаления", type: "error" });
    }
  };

  if (isAgentLoading) return <div className="agents-page-loading">Загрузка данных агента...</div>;

  return (
    <div className="agents-page">
      {contextHolder}
      <div className="agents-edit-header" style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate("/system/agents")}>Агенты</a> },
            { title: isNew ? "Новый агент" : formData.name },
          ]}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/system/agents")} />
            <Title level={2} style={{ margin: 0 }}>{isNew ? "Создание агента" : "Редактирование агента"}</Title>
          </div>
          <Space>
            {!isNew && !agentData?.data?.isBuiltIn && (
              <Popconfirm
                title="Удалить агента?"
                onConfirm={handleDelete}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<Trash2 size={16} />}>Удалить</Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<Save size={16} />} onClick={handleSubmit}>
              {size.width > 768 ? "Сохранить" : ""}
            </Button>
          </Space>
        </div>
      </div>

      <div className="agent-edit-content">
        <Card title="Основная информация" style={{ marginBottom: 24 }}>
          <div className="agent-form">
            <div className="form-row">
              <div className="form-item">
                <label>Имя агента *</label>
                <Input
                  size="large"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>Аватар (URL или имя файла)</label>
                <Input
                  size="large"
                  value={formData.avatar || ""}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>
            </div>
            <div className="form-item">
              <label>Описание</label>
              <Input
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card title="Инструкции (System Prompt)" style={{ marginBottom: 24 }}>
          <div className="form-item">
            <TextArea
              rows={15}
              style={{ fontFamily: 'monospace' }}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Подробные инструкции поведения агента и его роли..."
            />
          </div>
        </Card>

        <Card title="Настройки LLM и интерфейса">
          <div className="agent-form">
            <div className="form-item">
              <label>Приветственное сообщение</label>
              <Input
                value={formData.welcomeMessage || ""}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>Модель</label>
                <Select
                  style={{ width: "100%" }}
                  value={formData.preferredModel}
                  onChange={(v) => setFormData({ ...formData, preferredModel: v })}
                  options={models.map(m => ({ label: m.displayName, value: m.modelId }))}
                />
              </div>
              <div className="form-item">
                <label>Температура</label>
                <InputNumber
                  min={0} max={2} step={0.1}
                  style={{ width: "100%" }}
                  value={formData.temperature}
                  onChange={(v) => setFormData({ ...formData, temperature: v || 0.1 })}
                />
              </div>
            </div>

            <div className="form-item">
              <label>Инструменты</label>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                value={formData.tools}
                onChange={(v) => setFormData({ ...formData, tools: v })}
                options={tools.map(t => ({ label: t.name, value: t.id, desc: t.description }))}
                optionRender={(opt) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{opt.label}</strong>
                    <small style={{ color: '#888' }}>{(opt.data as any).desc}</small>
                  </div>
                )}
              />
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>Ярлыки (тэги)</label>
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  value={formData.labels}
                  onChange={(v) => setFormData({ ...formData, labels: v })}
                />
              </div>
              <div className="form-item" style={{ paddingTop: 30 }}>
                <Space>
                  <Switch
                    checked={formData.isPublic}
                    onChange={(v) => setFormData({ ...formData, isPublic: v })}
                  />
                  <span>Публичный агент</span>
                </Space>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
