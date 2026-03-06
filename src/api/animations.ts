// api/animations.ts — Animations API по API_DOCUMENTATION.md
import axios from "axios";
import { API_URL } from "../config";
import type {
  AnimationCreated,
  AnimationListItem,
  AnimationDetail,
  AnimationDefinition,
  SendAnimationToDeviceBody,
  SendAnimationResponse,
  UpdateAnimationParametersBody,
  UpdateAnimationParametersResponse,
  ParamDescription,
} from "../types/animation";

const withAuth = { withCredentials: true };

export const getAnimations = async (params?: {
  skip?: number;
  take?: number;
}): Promise<AnimationListItem[]> => {
  const res = await axios.get<AnimationListItem[]>(`${API_URL}api/animationsLists`, {
    ...withAuth,
    params: { skip: params?.skip ?? 0, take: Math.min(params?.take ?? 50, 100) },
  });
  return res.data;
};

export const getAnimationsCount = async (): Promise<number> => {
  const res = await axios.get<{ count: number }>(`${API_URL}api/animationsLists`, {
    ...withAuth,
    params: { amountOnly: true },
  });
  return res.data.count;
};

export const getAnimationDetail = async (id: string): Promise<AnimationDetail> => {
  const res = await axios.get<AnimationDetail>(`${API_URL}api/animationsLists/${id}`, {
    ...withAuth,
  });
  return res.data;
};

export const deleteAnimation = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}api/animations/${id}`, withAuth);
};

export const createAnimation = async (
  body: {
    prompt?: string;
    ledCount?: number;
    model?: string;
  },
  signal?: AbortSignal,
): Promise<AnimationCreated> => {
  const res = await axios.post<AnimationCreated>(`${API_URL}api/animations`, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
    signal,
  });
  return res.data;
};

export const sendAnimationToDevice = async (
  animationId: string,
  body: SendAnimationToDeviceBody
): Promise<SendAnimationResponse> => {
  const res = await axios.post<SendAnimationResponse>(
    `${API_URL}api/animations/select/${animationId}`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
};

export const updateAnimationBody = async (
  id: string,
  body: AnimationDetail["body"]
): Promise<AnimationDetail> => {
  const res = await axios.patch<AnimationDetail>(
    `${API_URL}api/animationsLists/${id}`,
    { body },
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
};

export const compileAnimation = async (
  animation: AnimationDefinition
): Promise<{
  ok: boolean;
  body?: AnimationDetail["body"];
  error?: string;
}> => {
  const res = await axios.post(
    `${API_URL}api/animations/constructor/compile`,
    { animation },
    { ...withAuth, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

export const createAnimationFromConstructor = async (body: {
  animation: AnimationDefinition;
  description?: string;
  labels?: string[];
  paramsDescription?: Record<string, ParamDescription>;
}): Promise<AnimationCreated> => {
  const res = await axios.post<AnimationCreated>(
    `${API_URL}api/animations/constructor`,
    body,
    { ...withAuth, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

export const updateAnimationFromConstructor = async (
  id: string,
  body: {
    animation?: AnimationDefinition;
    description?: string;
    labels?: string[];
    paramsDescription?: Record<string, ParamDescription>;
  }
): Promise<AnimationDetail> => {
  const res = await axios.patch<AnimationDetail>(
    `${API_URL}api/animationsLists/${id}`,
    body,
    { ...withAuth, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

export const enhancePrompt = async (
  body: {
    prompt: string;
    ledCount?: number;
    model?: string;
  },
  signal?: AbortSignal,
): Promise<string> => {
  const res = await axios.post<{ enhancedPrompt: string }>(
    `${API_URL}api/animations/enhance-prompt`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );
  return res.data.enhancedPrompt;
};

export const updateAnimationParameters = async (
  animationId: string,
  body: UpdateAnimationParametersBody
): Promise<UpdateAnimationParametersResponse> => {
  const res = await axios.post<UpdateAnimationParametersResponse>(
    `${API_URL}api/animations/${animationId}/parameters`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
};
