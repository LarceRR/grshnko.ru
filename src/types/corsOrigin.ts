export interface CorsOrigin {
  id: string;
  origin: string;
  label?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorsOriginBody {
  origin: string;
  label?: string;
  enabled?: boolean;
}

export interface UpdateCorsOriginBody {
  origin?: string;
  label?: string;
  enabled?: boolean;
}
