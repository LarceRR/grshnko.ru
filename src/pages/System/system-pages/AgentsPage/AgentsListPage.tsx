import { useQuery } from "@tanstack/react-query";
import { Button, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { chatApi } from "../../../../api/chat";
import { Bot, Plus, Edit } from "lucide-react";
import "./AgentsPage.scss";

const { Title, Text } = Typography;

export default function AgentsListPage() {
  const navigate = useNavigate();
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ["chat", "agents"],
    queryFn: () => chatApi.getAgents({ take: 100 }),
  });
  const agents = agentsData?.data?.data ?? [];

  if (isLoading) return <div className="agents-page-loading">Загрузка агентов...</div>;

  return (
    <div className="agents-page">
      <div className="agents-header">
        <div className="agents-header__title">
          <Bot size={24} />
          <Title level={2}>Агенты</Title>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate("/system/agents/new")}
        >
          Создать агента
        </Button>
      </div>

      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Здесь вы можете управлять ИИ-агентами, настраивать их инструкции и доступные инструменты.
      </Text>

      <div className="agents-list">
        {agents.length === 0 ? (
          <div className="empty-state">Агентов пока нет. Создайте первого агента.</div>
        ) : (
          agents.map((agent: any) => (
            <div key={agent.id} className="agent-item" onClick={() => navigate(`/system/agents/${agent.id}`)}>
              <div className="agent-item__info">
                <div className="agent-item__name-row">
                  <span className="agent-item__name">{agent.name}</span>
                  {agent.isBuiltIn && <Tag color="blue">Built-in</Tag>}
                  {agent.isPublic && <Tag color="green">Public</Tag>}
                </div>
                <div className="agent-item__desc">{agent.description}</div>
                <div className="agent-item__meta">
                  <Tag>{agent.preferredModel || "Default Model"}</Tag>
                  <Tag>Temp: {agent.temperature}</Tag>
                  {agent.labels?.map((l: string) => (
                    <Tag key={l}>{l}</Tag>
                  ))}
                </div>
              </div>
              <div className="agent-item__actions">
                <Button 
                  type="text" 
                  icon={<Edit size={18} />} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
