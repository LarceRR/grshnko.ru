import axios from "axios";
import { API_URL } from "../config";
import type {
  ChatSession,
  ChatAgent,
  SessionsListResponse,
  MessagesListResponse,
  UpdateSessionDto,
} from "../types/chat.types";

const withAuth = { withCredentials: true };

export const chatApi = {
  createSession: (agentId: string, title?: string) =>
    axios.post<ChatSession>(`${API_URL}api/chat/sessions`, { agentId, title }, withAuth),

  getSessions: (params?: { skip?: number; take?: number; status?: string; agentId?: string; search?: string }) =>
    axios.get<SessionsListResponse>(`${API_URL}api/chat/sessions`, { ...withAuth, params: params ?? {} }),

  getSession: (id: string) =>
    axios.get<ChatSession>(`${API_URL}api/chat/sessions/${id}`, withAuth),

  updateSession: (id: string, data: Partial<UpdateSessionDto>) =>
    axios.patch<ChatSession>(`${API_URL}api/chat/sessions/${id}`, data, withAuth),

  deleteSession: (id: string) =>
    axios.delete(`${API_URL}api/chat/sessions/${id}`, withAuth),

  getMessages: (sessionId: string, params?: { before?: string; limit?: number }) =>
    axios.get<MessagesListResponse>(`${API_URL}api/chat/sessions/${sessionId}/messages`, {
      ...withAuth,
      params: params ?? {},
    }),

  getAgents: (params?: { skip?: number; take?: number; label?: string; search?: string }) =>
    axios.get<{ data: ChatAgent[]; total: number; skip: number; take: number }>(
      `${API_URL}api/chat/agents`,
      { ...withAuth, params: params ?? {} },
    ),

  getAgent: (id: string) =>
    axios.get<ChatAgent>(`${API_URL}api/chat/agents/${id}`, withAuth),

  getModels: () =>
    axios.get<import("../types/llmModel").ModelOption[]>(
      `${API_URL}api/chat/models`,
      withAuth,
    ),

  stopGeneration: (sessionId: string) =>
    axios.post(`${API_URL}api/chat/sessions/${sessionId}/stop`, {}, withAuth),

  getBranches: (sessionId: string, messageId: string) =>
    axios.get<{ data: unknown[]; activeIndex: number; total: number }>(
      `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/branches`,
      withAuth,
    ),

  activateBranch: (
    sessionId: string,
    messageId: string,
    branchIndex: number,
  ) =>
    axios.post(
      `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/branches/${branchIndex}/activate`,
      {},
      withAuth,
    ),

  createAgent: (data: any) =>
    axios.post<ChatAgent>(`${API_URL}api/chat/agents`, data, withAuth),

  updateAgent: (id: string, data: Partial<ChatAgent>) =>
    axios.patch<ChatAgent>(`${API_URL}api/chat/agents/${id}`, data, withAuth),

  deleteAgent: (id: string) =>
    axios.delete(`${API_URL}api/chat/agents/${id}`, withAuth),

  getTools: () =>
    axios.get<{ id: string; name: string; description: string }[]>(
      `${API_URL}api/chat/tools`,
      withAuth,
    ),
};

// SSE streaming is done via fetch (POST with credentials), not axios
