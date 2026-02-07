// api/ota.ts — OTA API по API_DOCUMENTATION.md
import axios from "axios";
import { API_URL } from "../config";

const withAuth = { withCredentials: true };

export interface OtaTriggerResponse {
  ok: boolean;
  message: string;
  deviceId: string;
  firmware: string;
  version: string;
  topic: string;
}

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
