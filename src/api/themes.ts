import axios from "axios";
import { API_URL } from "../config";
import type {
  Theme,
  ThemeListParams,
  GenerateThemeBody,
  CreateThemeBody,
  UpdateThemeBody,
} from "../types/theme";

const withAuth = { withCredentials: true };
const base = `${API_URL}api/themes`;

function normalizeTheme(t: Theme): Theme & { id: string } {
  return { ...t, id: t.id ?? t._id };
}

export async function getThemes(
  params?: ThemeListParams
): Promise<Theme[] | { count: number }> {
  const res = await axios.get<Theme[] | { count: number }>(base, {
    ...withAuth,
    params,
  });
  if (Array.isArray(res.data)) {
    return res.data.map(normalizeTheme);
  }
  return res.data;
}

export async function getMySelectedTheme(): Promise<Theme | null> {
  const res = await axios.get<Theme | null>(`${base}/my/selected`, withAuth);
  if (!res.data) return null;
  return normalizeTheme(res.data);
}

export async function getTheme(id: string): Promise<Theme> {
  const res = await axios.get<Theme>(`${base}/${id}`, withAuth);
  return normalizeTheme(res.data);
}

export async function generateTheme(body: GenerateThemeBody): Promise<Theme> {
  const res = await axios.post<Theme>(`${base}/generate`, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
  });
  return normalizeTheme(res.data);
}

export async function createTheme(body: CreateThemeBody): Promise<Theme> {
  const res = await axios.post<Theme>(base, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
  });
  return normalizeTheme(res.data);
}

export async function updateTheme(
  id: string,
  body: UpdateThemeBody
): Promise<Theme> {
  const res = await axios.patch<Theme>(`${base}/${id}`, body, {
    ...withAuth,
    headers: { "Content-Type": "application/json" },
  });
  return normalizeTheme(res.data);
}

export async function deleteTheme(id: string): Promise<void> {
  await axios.delete(`${base}/${id}`, withAuth);
}

export async function selectTheme(themeId: string | null): Promise<void> {
  await axios.post(
    `${base}/select`,
    { themeId },
    {
      ...withAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
}
