// utils/httpTracker.ts
import axios, { InternalAxiosRequestConfig } from "axios";

export type RequestStatus = "pending" | "success" | "error";

export interface TrackedRequest {
  id: string; // уникальный ID
  url?: string;
  method?: string;
  status: RequestStatus;
  startTime: number;
  endTime?: number;
  error?: any;
  progress?: number; // для fetch или onDownloadProgress
}

type Listener = (request: TrackedRequest) => void;
const listeners: Listener[] = [];

export const addHttpListener = (listener: Listener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};

const notify = (request: TrackedRequest) => {
  listeners.forEach((l) => l(request));
};

// --- Перехват fetch ---
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const [input, init] = args;
  let url: string;
  let method = init?.method || "GET";

  if (typeof input === "string") url = input;
  else if (input instanceof Request) {
    url = input.url;
    method = input.method;
  } else if (input instanceof URL) url = input.toString();
  else url = "";

  const tracked: TrackedRequest = {
    id: Math.random().toString(36).substring(2, 9),
    url,
    method,
    status: "pending",
    startTime: Date.now(),
  };

  notify(tracked);

  try {
    const response = await originalFetch(...args);
    tracked.status = "success";
    tracked.endTime = Date.now();
    notify(tracked);
    return response;
  } catch (err) {
    tracked.status = "error";
    tracked.error = err;
    tracked.endTime = Date.now();
    notify(tracked);
    throw err;
  }
};

// --- Интерцепторы Axios ---
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // гарантируем, что headers не undefined
  if (!config.headers) {
    config.headers = {} as InternalAxiosRequestConfig["headers"];
  }

  // создаём объект трекинга запроса
  const tracked = {
    id: Math.random().toString(36).substring(2, 9),
    url: config.url,
    method: config.method,
    status: "pending" as const,
    startTime: Date.now(),
    progress: 0,
  };

  (config as any)._tracked = tracked;

  // onDownloadProgress для прогресса
  config.onDownloadProgress = (e) => {
    tracked.progress = e.loaded / (e.total || 1);
    listeners.forEach((l) => l(tracked));
  };

  // возвращаем config с правильным типом
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const tracked: TrackedRequest | undefined = (response.config as any)?._tracked;
    if (tracked) {
      tracked.status = "success";
      tracked.endTime = Date.now();
      notify(tracked);
    }
    return response;
  },
  (error) => {
    const tracked: TrackedRequest | undefined = (error.config as any)?._tracked;
    if (tracked) {
      tracked.status = "error";
      tracked.endTime = Date.now();
      tracked.error = error;
      notify(tracked);
    }
    return Promise.reject(error);
  }
);
