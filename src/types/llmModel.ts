// types/llmModel.ts

/** Модель для дропдауна (чат, темы, анимации и т.д.) — общий контракт с API */
export interface ModelOption {
  id?: string;
  _id?: string;
  modelId: string;
  displayName?: string | null;
  isActive?: boolean;
  isFree?: boolean;
  /** Агрегатор: openrouter, huggingface и т.д. */
  aggregator?: string | null;
  /** Длина контекста (токены) */
  contextLength?: number | null;
  lastUsedAt?: string | null;
}

export interface LLMModel extends ModelOption {
  _id: string;
  totalUsage?: number;
  successCount?: number;
  failureCount?: number;
  totalLatencyMs?: number;
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
