// api/animations.ts — Animations API по API_DOCUMENTATION.md
import axios from "axios";
import { API_URL } from "../config";
import type {
  AnimationCreated,
  AnimationListItem,
  SendAnimationToDeviceBody,
  SendAnimationResponse,
} from "../types/animation";

const withAuth = { withCredentials: true };

export const getAnimations = async (params?: {
  skip?: number;
  take?: number;
}): Promise<AnimationListItem[]> => {
  const res = await axios.get<AnimationListItem[]>(`${API_URL}api/animations/`, {
    ...withAuth,
    params: { skip: params?.skip ?? 0, take: Math.min(params?.take ?? 50, 100) },
  });
  return res.data;
};

export const deleteAnimation = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}api/animations/${id}`, withAuth);
};

export const createAnimation = async (body: {
  prompt?: string;
  ledCount?: number;
}): Promise<AnimationCreated> => {
  const res = await axios.post<AnimationCreated>(`${API_URL}api/animations`, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
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
