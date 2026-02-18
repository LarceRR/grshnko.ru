/**
 * Types for Animation Simulator
 */

export interface AnimationData {
  ledCount: number;
  fps: number;
  brightness: number;
  numParams: number;
  bytecodeArr: Uint8Array;
  paramNames: string[];
  paramDefaults: number[];
}

export interface LED {
  r: number;
  g: number;
  b: number;
}

export interface PixelHistory {
  t: number;
  r: number;
  g: number;
  b: number;
}

export interface LayerOutput {
  r: number;
  g: number;
  b: number;
  brightness: number;
  opacity: number;
  active: boolean;
}

export interface SimulatorState {
  animData: AnimationData | null;
  stateVars: Int32Array[];
  params: Float32Array;
  leds: LED[];
  playing: boolean;
  paused: boolean;
  currentT: number;
  selectedPixel: number;
  pixelHistory: PixelHistory[];
  fps: number;
}
