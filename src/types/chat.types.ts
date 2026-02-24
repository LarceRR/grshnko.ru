// Chat API types (align with backend)

export type ChatMessageRole = "SYSTEM" | "USER" | "ASSISTANT" | "TOOL";

export interface ChatMessageBranchInfo {
  currentIndex: number;
  totalBranches: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string | null;
  toolCalls?: unknown;
  toolResults?: unknown;
  agentId?: string | null;
  model?: string | null;
  createdAt: string;
  branchInfo?: ChatMessageBranchInfo;
}

export interface ChatSessionAgent {
  id: string;
  name: string;
  avatar: string | null;
  description?: string;
  welcomeMessage?: string | null;
}

export interface ChatSession {
  id: string;
  title: string | null;
  status: "ACTIVE" | "ARCHIVED";
  userId: string;
  agentId: string;
  agent: ChatSessionAgent;
  createdAt: string;
  updatedAt: string;
  lastMessage?: { id: string; role: string; content: string | null; createdAt: string } | null;
}

export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string | null;
  avatar: string | null;
  labels: string[];
  preferredModel: string | null;
  isBuiltIn: boolean;
  isPublic: boolean;
  authorId?: string;
}

export interface SessionsListResponse {
  data: ChatSession[];
  total: number;
  skip: number;
  take: number;
}

export interface MessagesListResponse {
  data: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UpdateSessionDto {
  title?: string;
  status?: "ACTIVE" | "ARCHIVED";
  agentId?: string;
}

// SSE stream event types (from backend)
export interface ToolCallEvent {
  callId: string;
  toolName?: string;
  arguments?: unknown;
  status?: "running" | "done";
  result?: unknown;
  success?: boolean;
}

export interface QuestionnaireOption {
  title: string;
  description?: string;
  image?: string;
  value?: string;
}

/** One section in a questionnaire (e.g. one question with its choice options). */
export interface QuestionnaireGroup {
  label?: string;
  question?: string;
  type?: "select" | "multiselect";
  options: QuestionnaireOption[];
}

export interface QuestionnaireData {
  question?: string;
  options: QuestionnaireOption[];
  /** When set, render one section per group instead of one flat list of options. */
  groups?: QuestionnaireGroup[];
  [key: string]: unknown;
}
