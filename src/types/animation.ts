// types/animation.ts — по API_DOCUMENTATION.md

export interface AnimationCreated {
  id: string;
  body: string;
  schemaVersion: string;
  animationHardness?: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
  usedColors?: string[];
}

/** Элемент списка с API GET /api/animations/ (без тела body) */
export interface AnimationListItem {
  id: string;
  schemaVersion?: string;
  animationHardness?: number;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
  usedColors?: string[];
}

export interface SendAnimationToDeviceBody {
  deviceId: string;
  location?: string;
}

export interface SendAnimationResponse {
  ok: boolean;
  message: string;
  animationId: string;
  location?: string;
  deviceId: string;
  topic?: string;
}
