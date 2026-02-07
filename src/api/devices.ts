// api/devices.ts — Devices API по API_DOCUMENTATION.md
import axios from "axios";
import { API_URL } from "../config";
import type {
  Device,
  DeviceWithLogs,
  DeviceStatusResponse,
  DeviceLog,
  DeviceLogsParams,
  RpcResponse,
} from "../types/device";

const withAuth = { withCredentials: true };

export const getDevices = async (): Promise<Device[]> => {
  const res = await axios.get<Device[]>(`${API_URL}api/devices`, withAuth);
  return res.data;
};

export const getDevice = async (id: string): Promise<DeviceWithLogs> => {
  const res = await axios.get<DeviceWithLogs>(`${API_URL}api/devices/${id}`, withAuth);
  return res.data;
};

export const getDeviceStatus = async (id: string): Promise<DeviceStatusResponse> => {
  const res = await axios.get<DeviceStatusResponse>(
    `${API_URL}api/devices/${id}/status`,
    withAuth
  );
  return res.data;
};

export const patchDevice = async (
  id: string,
  data: { name?: string; location?: string }
): Promise<Device> => {
  const res = await axios.patch<Device>(`${API_URL}api/devices/${id}`, data, withAuth);
  return res.data;
};

export const deleteDevice = async (id: string): Promise<{ ok: boolean; message: string }> => {
  const res = await axios.delete<{ ok: boolean; message: string }>(
    `${API_URL}api/devices/${id}`,
    withAuth
  );
  return res.data;
};

export const deviceRpc = async (
  id: string,
  method: string,
  params?: Record<string, unknown>
): Promise<RpcResponse> => {
  const res = await axios.post<RpcResponse>(
    `${API_URL}api/devices/${id}/rpc`,
    { method, params: params ?? {} },
    withAuth
  );
  return res.data;
};

export const getDeviceLogs = async (
  deviceId: string,
  params?: DeviceLogsParams
): Promise<DeviceLog[]> => {
  const res = await axios.get<DeviceLog[]>(`${API_URL}api/devices/${deviceId}/logs`, {
    ...withAuth,
    params,
  });
  return res.data;
};

export const clearDeviceLogs = async (
  deviceId: string
): Promise<{ ok: boolean; deleted: number }> => {
  const res = await axios.delete<{ ok: boolean; deleted: number }>(
    `${API_URL}api/devices/${deviceId}/logs`,
    withAuth
  );
  return res.data;
};
