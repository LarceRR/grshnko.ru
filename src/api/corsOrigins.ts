import axios from "axios";
import { API_URL } from "../config";
import type {
  CorsOrigin,
  CreateCorsOriginBody,
  UpdateCorsOriginBody,
} from "../types/corsOrigin";

const withAuth = { withCredentials: true };

export const getCorsOrigins = async (): Promise<CorsOrigin[]> => {
  const res = await axios.get<CorsOrigin[]>(`${API_URL}api/cors-origins`, {
    ...withAuth,
  });
  return res.data;
};

export const createCorsOrigin = async (
  body: CreateCorsOriginBody,
): Promise<CorsOrigin> => {
  const res = await axios.post<CorsOrigin>(
    `${API_URL}api/cors-origins`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    },
  );
  return res.data;
};

export const updateCorsOrigin = async (
  id: string,
  body: UpdateCorsOriginBody,
): Promise<CorsOrigin> => {
  const res = await axios.patch<CorsOrigin>(
    `${API_URL}api/cors-origins/${id}`,
    body,
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    },
  );
  return res.data;
};

export const deleteCorsOrigin = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}api/cors-origins/${id}`, withAuth);
};
