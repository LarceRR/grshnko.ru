// api/ota.ts — OTA API
import axios from "axios";
import { API_URL } from "../config";

const withAuth = { withCredentials: true };

export interface OtaFirmwareItem {
  id: string;
  filename: string;
  version: string;
  sha256: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface OtaUploadResponse {
  ok: boolean;
  message: string;
  filename: string;
  version: string;
  sha256: string;
  size: number;
  url: string;
}

export interface OtaTriggerResponse {
  ok: boolean;
  message: string;
  deviceId: string;
  firmware: string;
  version: string;
  topic: string;
}

export interface OtaTriggerAllResponse {
  ok: boolean;
  message: string;
  triggered: number;
  skipped: number;
  devices: string[];
}

/** POST /api/ota/upload — загрузка с версией (уникальное имя) */
export const uploadOtaFirmware = async (
  file: File,
  version?: string
): Promise<OtaUploadResponse> => {
  const formData = new FormData();
  formData.append("firmware", file);
  if (version != null && version !== "") formData.append("version", version);
  const res = await axios.post<OtaUploadResponse>(
    `${API_URL}api/ota/upload`,
    formData,
    {
      ...withAuth,
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: 5 * 1024 * 1024,
      maxContentLength: 5 * 1024 * 1024,
    }
  );
  return res.data;
};

/** POST /api/ota/firmware — загрузка как текущая OTA (firmware.bin) */
export const uploadOtaAsCurrent = async (file: File): Promise<OtaUploadResponse> => {
  const formData = new FormData();
  formData.append("firmware", file);
  const res = await axios.post<OtaUploadResponse>(
    `${API_URL}api/ota/firmware`,
    formData,
    {
      ...withAuth,
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: 5 * 1024 * 1024,
      maxContentLength: 5 * 1024 * 1024,
    }
  );
  return res.data;
};

/** GET /api/ota/list */
export const getOtaList = async (): Promise<OtaFirmwareItem[]> => {
  const res = await axios.get<OtaFirmwareItem[]>(`${API_URL}api/ota/list`, withAuth);
  return res.data;
};

/** POST /api/ota/trigger/:deviceId */
export const triggerOta = async (
  deviceId: string,
  firmware?: string
): Promise<OtaTriggerResponse> => {
  const res = await axios.post<OtaTriggerResponse>(
    `${API_URL}api/ota/trigger/${deviceId}`,
    firmware ? { firmware } : {},
    { ...withAuth, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

/** POST /api/ota/trigger-all */
export const triggerOtaAll = async (): Promise<OtaTriggerAllResponse> => {
  const res = await axios.post<OtaTriggerAllResponse>(
    `${API_URL}api/ota/trigger-all`,
    {},
    withAuth
  );
  return res.data;
};
