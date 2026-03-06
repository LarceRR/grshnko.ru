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

export interface UpdateAnimationParametersBody {
  deviceId: string;
  parameters: Record<string, number>;
}

export interface UpdateAnimationParametersResponse {
  ok: boolean;
  message: string;
  animationId: string;
  deviceId: string;
  parameters: Record<string, number>;
  method: "websocket" | "queued";
}

export interface ParamDescription {
  description: string;
  increaseEffect: string;
  decreaseEffect: string;
}

export interface AnimationDetail extends AnimationListItem {
  description?: string | null;
  paramsDescription?: Record<string, ParamDescription> | null;
  body: {
    ledCount: number;
    fps: number;
    brightness: number;
    numParams: number;
    bytecode: string;
    paramNames: string[];
    paramDefaults: number[];
  };
  sourceJson?: string | null;
}

/** AnimationDefinition — JSON format for constructor (matches backend) */
export interface AnimationLayer {
  name?: string;
  selector: string;
  color: { r: string; g: string; b: string };
  brightness?: string | number;
  opacity?: string | number;
  blend?: "replace" | "add" | "multiply" | "screen" | "overlay" | "lighten";
}

export interface AnimationDefinition {
  engineVersion: string;
  name: string;
  ledCount: number;
  fps: number;
  brightness: number;
  parameters: Record<string, number>;
  state_vars?: string[];
  layers: AnimationLayer[];
  update_rules?: string[];
}
