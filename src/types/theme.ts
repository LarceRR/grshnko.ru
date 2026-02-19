export interface Theme {
  id?: string;
  _id: string;
  name: string;
  description: string | null;
  type: "light" | "dark" | "custom";
  labels: string[];
  isPublic: boolean;
  authorId: string;
  author: { id: string; username: string };
  colors: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeListParams {
  skip?: number;
  take?: number;
  type?: "light" | "dark" | "custom";
  labels?: string;
  authorId?: string;
  amountOnly?: "true";
}

export interface GenerateThemeBody {
  prompt: string;
  model?: string;
}

export interface CreateThemeBody {
  name: string;
  description?: string;
  type: "light" | "dark" | "custom";
  labels?: string[];
  isPublic?: boolean;
  colors: Record<string, string>;
}

export interface UpdateThemeBody {
  name?: string;
  description?: string;
  type?: "light" | "dark" | "custom";
  labels?: string[];
  isPublic?: boolean;
  colors?: Record<string, string>;
}
