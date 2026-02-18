// api/llmModels.ts — LLM Models API
import axios from "axios";
import { API_URL } from "../config";
import type {
  LLMModel,
  CreateLLMModelBody,
  UpdateLLMModelBody,
} from "../types/llmModel";

const withAuth = { withCredentials: true };

export const getLLMModels = async (): Promise<LLMModel[]> => {
  const res = await axios.get<LLMModel[]>(`${API_URL}api/llm-models/`, {
    ...withAuth,
  });
  return res.data;
};

export const createLLMModel = async (
  body: CreateLLMModelBody
): Promise<LLMModel> => {
  const res = await axios.post<LLMModel>(`${API_URL}api/llm-models/`, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const updateLLMModel = async (
  id: string,
  body: UpdateLLMModelBody
): Promise<LLMModel> => {
  const res = await axios.patch<LLMModel>(
    `${API_URL}api/llm-models/${id}`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
};

export const deleteLLMModel = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}api/llm-models/${id}`, withAuth);
};
