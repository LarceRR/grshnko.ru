import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  isPasswordConfirmationChallenge,
  requestPasswordConfirmation,
} from "../security/passwordChallenge";

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

const originalFetch = window.fetch.bind(window);

type TrackedAxiosConfig = InternalAxiosRequestConfig & {
  _tracked?: TrackedRequest;
  _passwordConfirmationRetried?: boolean;
};

window.fetch = async (...args: Parameters<typeof fetch>) => {
  const tracked = createFetchTracking(args);
  notify(tracked);

  try {
    const response = await runFetch(args, false);
    tracked.status = response.ok ? "success" : "error";
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

const createFetchTracking = (args: Parameters<typeof fetch>): TrackedRequest => {
  const [input, init] = args;
  const url = readFetchUrl(input);
  const method = readFetchMethod(input, init);
  return {
    id: Math.random().toString(36).substring(2, 9),
    url,
    method,
    status: "pending",
    startTime: Date.now(),
  };
};

const readFetchUrl = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  if (input instanceof URL) return input.toString();
  return "";
};

const readFetchMethod = (
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
): string => {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return "GET";
};

const runFetch = async (
  args: Parameters<typeof fetch>,
  alreadyRetried: boolean,
): Promise<Response> => {
  const [input, init] = args;
  const request = input instanceof Request ? input.clone() : input;
  const response = await originalFetch(request, init);
  if (alreadyRetried || !(await isFetchPasswordChallenge(response))) return response;

  await requestPasswordConfirmation();
  return runFetch(args, true);
};

axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = {} as InternalAxiosRequestConfig["headers"];
  }

  const tracked = {
    id: Math.random().toString(36).substring(2, 9),
    url: config.url,
    method: config.method,
    status: "pending" as const,
    startTime: Date.now(),
    progress: 0,
  };

  (config as TrackedAxiosConfig)._tracked = tracked;

  config.onDownloadProgress = (e) => {
    tracked.progress = e.loaded / (e.total || 1);
    listeners.forEach((l) => l(tracked));
  };

  return config;
});

axios.interceptors.response.use(
  (response) => {
    const tracked = (response.config as TrackedAxiosConfig)?._tracked;
    if (tracked) {
      tracked.status = "success";
      tracked.endTime = Date.now();
      notify(tracked);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (await shouldRetryAxios(error)) {
      await requestPasswordConfirmation();
      const config = error.config as TrackedAxiosConfig;
      config._passwordConfirmationRetried = true;
      return axios.request(config);
    }

    const tracked = (error.config as TrackedAxiosConfig | undefined)?._tracked;
    if (tracked) {
      tracked.status = "error";
      tracked.endTime = Date.now();
      tracked.error = error;
      notify(tracked);
    }
    return Promise.reject(error);
  }
);

const isFetchPasswordChallenge = async (response: Response): Promise<boolean> => {
  if (response.status !== 403) return false;
  const payload = await response.clone().json().catch(() => null);
  return isPasswordConfirmationChallenge(payload);
};

const shouldRetryAxios = async (error: AxiosError): Promise<boolean> => {
  const config = error.config as TrackedAxiosConfig | undefined;
  if (!config || config._passwordConfirmationRetried) return false;
  return error.response?.status === 403 && isPasswordConfirmationChallenge(error.response.data);
};
