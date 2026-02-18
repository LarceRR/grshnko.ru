// types/llmModel.ts

export interface LLMModel {
  _id: string;
  modelId: string;
  displayName?: string;
  isActive?: boolean;
  isFree?: boolean;
  totalUsage?: number;
  successCount?: number;
  failureCount?: number;
  totalLatencyMs?: number;
  lastUsedAt?: string;
  lastSuccessAt?: string;
  lastLatencyMs?: number;
  lastError?: string | null;
}

export interface CreateLLMModelBody {
  modelId: string;
  displayName?: string;
  isActive?: boolean;
  isFree?: boolean;
}

export interface UpdateLLMModelBody {
  modelId?: string;
  displayName?: string;
  isActive?: boolean;
  isFree?: boolean;
}
