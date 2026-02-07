// types/device.ts — по API_DOCUMENTATION.md

export interface Device {
  id: string;
  deviceId: string;
  name?: string;
  location: string;
  status: "online" | "offline" | "error";
  firmwareVersion?: string;
  ledCount?: number;
  ipAddress?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;

  freeHeap?: number;
  minFreeHeap?: number;
  rssi?: number;
  wifiChannel?: number;
  bssid?: string;

  macAddress?: string;
  chipModel?: string;
  chipRevision?: number;
  cpuFreqMHz?: number;
  flashSize?: number;
  sketchSize?: number;
  freeSketchSpace?: number;
  sdkVersion?: string;

  playing?: boolean;
  brightness?: number;
  currentAnimationId?: string;

  uptime?: number;
  lastResetReason?: string;
  bootCount?: number;
}

export interface DeviceWithLogs extends Device {
  logs: DeviceLog[];
}

export interface DeviceLog {
  id: string;
  deviceId?: string;
  severity: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
  uptime?: number;
  freeHeap?: number;
  createdAt: string;
}

export interface DeviceStatusResponse {
  ok: boolean;
  deviceId: string;
  status: string;
  uptime?: number;
  freeHeap?: number;
  rssi?: number;
  playing?: boolean;
  brightness?: number;
  currentAnimationId?: string;
}

export interface RpcResponse {
  ok: boolean;
  message: string;
  topic?: string;
}

export interface DeviceLogsParams {
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
