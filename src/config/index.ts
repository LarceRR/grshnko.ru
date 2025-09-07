// config/index.ts
const API_URLS: Record<string, string | undefined> = {
  production: import.meta.env.VITE_API_URL,
  development: import.meta.env.VITE_DEV_API_URL,
  staging: import.meta.env.VITE_STAGING_API_URL,
};

export const API_URL = `${API_URLS[import.meta.env.VITE_MODE] ?? ""}`;