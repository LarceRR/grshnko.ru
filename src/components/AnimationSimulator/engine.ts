/**
 * JS replica of ESP32 ExpressionExecutor — Q16.16 stack-based bytecode VM (Upgraded).
 * Replaces Q8.8 logic with 32-bit fixed point to solve overflow issues.
 */

// Q16.16 fixed-point (int32_t)
const FP_SHIFT = 16;
const FP_ONE = 1 << FP_SHIFT; // 65536
const fpFromInt = (x: number): number => x << FP_SHIFT;
// Clamp to signed 32-bit range (simulating int32 behavior in JS)
const toInt32 = (v: number): number => v | 0;

// Bytecode opcodes (must match firmware)
export const Op = {
  NOP: 0x00,
  PUSH_I: 0x01,
  PUSH_T: 0x02,
  PUSH_R: 0x03,
  PUSH_CONST: 0x04,
  PUSH_PARAM: 0x05,
  PUSH_CONST32: 0x06,
  PUSH_L: 0x07,
  ADD: 0x10,
  SUB: 0x11,
  MUL: 0x12,
  DIV: 0x13,
  MOD: 0x14,
  LT: 0x15,
  GT: 0x16,
  LE: 0x17,
  GE: 0x18,
  EQ: 0x19,
  NE: 0x1a,
  AND: 0x1b,
  OR: 0x1c,
  NOT: 0x1d,
  SIN: 0x20,
  COS: 0x21,
  MIN: 0x22,
  MAX: 0x23,
  ABS: 0x24,
  FLOOR: 0x25,
  ROUND: 0x26,
  NOISE: 0x27,
  CLAMP: 0x28,
  SELECT: 0x29,
  TAN: 0x2a,
  CEIL: 0x2b,
  FRACT: 0x2c,
  POW: 0x2d,
  SQRT: 0x2e,
  LERP: 0x2f,
  OUT_R: 0x30,
  OUT_G: 0x31,
  OUT_B: 0x32,
  OUT_BRIGHTNESS: 0x33,
  OUT_OPACITY: 0x34,
  OUT_SELECTOR: 0x35,
  HSV: 0x36,
  STATE_GET: 0x40,
  STATE_SET: 0x41,
  LAYER_START: 0x50,
  LAYER_END: 0x51,
  UPDATE_START: 0x52,
  UPDATE_END: 0x53,
  // Phase 1: Extended math
  NOISE2D: 0x60,
  HASH: 0x61,
  SMOOTHSTEP: 0x62,
  STEP: 0x63,
  MAP: 0x64,
  EASE_IN: 0x65,
  EASE_OUT: 0x66,
  EASE_INOUT: 0x67,
  BOUNCE: 0x68,
  ELASTIC: 0x69,
  // Phase 2: State system extensions
  STATE_GET_OFFSET: 0x6a,
  GLOBAL_GET: 0x6b,
  GLOBAL_SET: 0x6c,
  MIRROR: 0x6d,
  REVERSE: 0x6e,
  WRAP: 0x6f,
  // Phase 3: Event system
  PUSH_EVT_VAL: 0x70,
  PUSH_EVT_POS: 0x71,
  PUSH_EVT_WIDTH: 0x72,
  // Phase 4: Previous frame
  PUSH_PREV_R: 0x73,
  PUSH_PREV_G: 0x74,
  PUSH_PREV_B: 0x75,
  // Phase 5: Particle system
  PUSH_PARTICLE_COUNT: 0x76,
  PUSH_PARTICLE_NEAR: 0x77,
  PUSH_PARTICLE_NEAR_R: 0x78,
  PUSH_PARTICLE_NEAR_G: 0x79,
  PUSH_PARTICLE_NEAR_B: 0x7a,
  // Phase 6: Temporal Echo (Ring Delay Lines)
  TEMPORAL_ECHO_R: 0x7b, // stack: [N] → R value N frames ago at pixel i
  TEMPORAL_ECHO_G: 0x7c, // stack: [N] → G value N frames ago at pixel i
  TEMPORAL_ECHO_B: 0x7d, // stack: [N] → B value N frames ago at pixel i
  // Phase 7: Quantum Wave Collapse
  WAVE_COLLAPSE: 0x7e,   // stack: [prob 0..FP_ONE] → 1 if rand<prob else 0
  // Phase 8: Field Flow Dynamics (Hydrodynamic Advection & Diffusion)
  FIELD_GET: 0x7f,       // push field[i] as Q16.16 (0..FP_ONE); field auto-diffuses each tick
  FIELD_SET: 0x80,       // pop Q16.16 → field[i] (clamped 0..FP_ONE)
  // Phase 9: Reaction-Threshold Propagation (Avalanche)
  CHARGE_GET: 0x81,      // push charge[i] as Q16.16; charge auto-propagates when ≥1.0
  CHARGE_SET: 0x82,      // pop Q16.16 → charge[i]
  // Phase 10: Elementary Cellular Automata (Wolfram CA)
  CA_RULE: 0x83,         // inline: rule byte (0-255). Reads prevFrame R neighbors → 0 or FP_ONE
  // Phase 4b: FM/PM Synthesis convenience opcode
  FMSIN: 0x84,           // stack: [carrier_phase, mod_phase, mod_depth] → phase-modulated sin
  // Phase 1: Domain & Time Warping
  LOCAL_I_SET: 0x85,     // pop Q16.16 → override PUSH_I for this pixel's execution
  LOCAL_T_SET: 0x86,     // pop Q16.16 (seconds) → override PUSH_T for this pixel's execution
  END: 0xff,
} as const;

const OP_NAMES: Record<number, string> = {};
for (const [k, v] of Object.entries(Op)) {
  OP_NAMES[v] = k;
}

const STACK_SIZE = 16;
const SIN_LUT_SIZE = 256;
const TEMPORAL_ECHO_DEPTH = 32; // frames stored in ring buffer for temporal echo
export const MAX_LEDS = 300;
export const MAX_STATE_VARS = 5;
export const MAX_ANIM_PARAMS = 10;
export const MAX_GLOBAL_VARS = 4;
export const MAX_EVENT_SLOTS = 4;
export const MAX_PARTICLES = 16;

/** Simulator engine state: events, globals, particles, previous frame buffer */
export interface SimulatorEngineState {
  globals: Float64Array;
  events: Array<{ val: number; pos: number; width: number; decay: number }>;
  particles: Array<{
    x: number; vx: number; life: number; decay: number; gravity: number;
    r: number; g: number; b: number; size: number; active: boolean;
  }>;
  prevFrame: Uint8Array[]; // prevFrame[i] = [r, g, b]
  // Phase 6: Temporal Echo — ring buffer of TEMPORAL_ECHO_DEPTH past frames
  frameHistory: Array<Uint8Array[]>; // frameHistory[slot][i] = [r, g, b]
  frameHistoryHead: number;          // index of the most-recently written slot
  // Phase 8: Field Flow Dynamics — density field that auto-diffuses each tick
  field: Float32Array;   // field[i] ∈ [0, 1]
  // Phase 9: Reaction-Threshold Propagation — charge that propagates on threshold
  charge: Float32Array;  // charge[i] ≥ 0; fires + resets when ≥ 1.0
}

// Sin/Cos LUTs: Q15.0 format (match firmware) — -32768..32767 for -1..1, then << 1 for Q16.16
const sinLut = new Int16Array(SIN_LUT_SIZE);
const cosLut = new Int16Array(SIN_LUT_SIZE);
for (let i = 0; i < SIN_LUT_SIZE; i++) {
  const rad = (2.0 * Math.PI * i) / SIN_LUT_SIZE;
  sinLut[i] = Math.max(-32768, Math.min(32767, Math.round(Math.sin(rad) * 32767)));
  cosLut[i] = Math.max(-32768, Math.min(32767, Math.round(Math.cos(rad) * 32767)));
}

// Noise: MUST match firmware (fast_hash + interpolate). Output 0..1 in Q16.16.
function fast_hash(n: number): number {
  let s = n >>> 0;
  s = (((s >>> 16) ^ s) * 0x45d9f3b) >>> 0;
  s = (((s >>> 16) ^ s) * 0x45d9f3b) >>> 0;
  s = ((s >>> 16) ^ s) >>> 0;
  return s & 0xff; // 0..255 raw
}

function noise(x: number): number {
  const xi = x >> 16;
  const xf = x & 0xffff;
  const v1 = fast_hash(xi);
  const v2 = fast_hash(xi + 1);
  const res = v1 + Math.round(((v2 - v1) * xf) / 65536);
  return toInt32(Math.floor((res * 65536) / 255));
}

function noise2D(x: number, y: number): number {
  const ix = x >> 16, iy = y >> 16;
  const fx = x & 0xffff, fy = y & 0xffff;
  const v00 = fast_hash(((ix + iy * 7919) | 0) >>> 0);
  const v10 = fast_hash(((ix + 1 + iy * 7919) | 0) >>> 0);
  const v01 = fast_hash(((ix + (iy + 1) * 7919) | 0) >>> 0);
  const v11 = fast_hash(((ix + 1 + (iy + 1) * 7919) | 0) >>> 0);
  const top = v00 + Math.round(((v10 - v00) * fx) / 65536);
  const bot = v01 + Math.round(((v11 - v01) * fx) / 65536);
  const res = top + Math.round(((bot - top) * fy) / 65536);
  return toInt32(Math.floor((res * 65536) / 255));
}

function hashFn(seed: number): number {
  const i = seed >> 16;
  const h = fast_hash(i >>> 0);
  return toInt32(Math.floor((h * 65536) / 255));
}

import type { LayerOutput } from "./types";

/**
 * Execute a bytecode segment.
 * Returns { r, g, b, brightness, opacity, active }
 *
 * stateVarsRead: optional read-only snapshot used by STATE_GET / STATE_GET_OFFSET.
 * When null, reads fall back to stateVars (same buffer as writes — existing behaviour).
 * Pass a pre-frame snapshot here during update_rules execution to ensure all pixels
 * see the same state from the start of the frame (proper double-buffering).
 */
function execSegment(
  i: number,
  t: number,
  r: number,
  bytecode: Uint8Array,
  start: number,
  end: number,
  params: Float32Array,
  numParams: number,
  stateVars: Int32Array[],
  ledCount: number,
  engine: SimulatorEngineState | null = null,
  stateVarsRead: Int32Array[] | null = null
): LayerOutput {
  // Which buffer to READ state from. Writes always go to stateVars.
  const svRead = stateVarsRead ?? stateVars;
  const stack = new Int32Array(STACK_SIZE); // 32-bit stack
  let sp = -1;
  // Domain & Time Warping (Phase 1): local overrides for i and t within this pixel's execution.
  // Initialized to the true values; LOCAL_I_SET / LOCAL_T_SET can override them.
  let localI_fp = fpFromInt(i); // Q16.16
  let localT_ms = t;            // milliseconds (same units as t param)
  const layerOut: LayerOutput = {
    r: 0,
    g: 0,
    b: 0,
    brightness: 255,
    opacity: 255,
    active: true,
  };
  let pc = start;

  while (pc < end) {
    const op = bytecode[pc++];
    if (sp >= STACK_SIZE - 2) break;

    switch (op) {
      case Op.NOP:
        break;

      case Op.PUSH_I:
        stack[++sp] = localI_fp; // Q16.16; overridable via LOCAL_I_SET
        break;

      case Op.PUSH_T: {
        // t (ms) converted to seconds in Q16.16; overridable via LOCAL_T_SET
        const tSec = localT_ms / 1000.0;
        stack[++sp] = toInt32(tSec * FP_ONE);
        break;
      }

      case Op.PUSH_R:
        stack[++sp] = fpFromInt(r); // r is 0..255 integer
        break;

      case Op.PUSH_L:
        stack[++sp] = fpFromInt(ledCount);
        break;

      case Op.PUSH_CONST: {
        if (pc + 2 > end) return layerOut;
        // Read Q8.8 signed 16-bit
        let v = bytecode[pc] | (bytecode[pc + 1] << 8);
        if ((v & 0x8000) !== 0) v = v | 0xffff0000; // Sign extend properly for JS bitwise
        // Manual sign extension:
        if (v > 32767) v -= 65536;

        pc += 2;
        stack[++sp] = toInt32(v << 8);
        break;
      }

      case Op.PUSH_CONST32: {
        if (pc + 4 > end) return layerOut;
        // Read Q16.16 signed 32-bit (little endian)
        const v =
          bytecode[pc] |
          (bytecode[pc + 1] << 8) |
          (bytecode[pc + 2] << 16) |
          (bytecode[pc + 3] << 24);
        pc += 4;
        stack[++sp] = v;
        break;
      }

      case Op.PUSH_PARAM: {
        if (pc >= end) return layerOut;
        const idx = bytecode[pc++];
        if (idx >= numParams) {
          stack[++sp] = 0;
          break;
        }
        // Param is float. Convert to Q16.16
        stack[++sp] = toInt32(params[idx] * FP_ONE);
        break;
      }

      // Arithmetic (Q16.16)
      case Op.ADD:
        if (sp >= 1) {
          stack[sp - 1] = toInt32(stack[sp - 1] + stack[sp]);
          sp--;
        }
        break;
      case Op.SUB:
        if (sp >= 1) {
          stack[sp - 1] = toInt32(stack[sp - 1] - stack[sp]);
          sp--;
        }
        break;
      case Op.MUL:
        if (sp >= 1) {
          // (A * B) >> 16
          // Use double precision math to simulate 64-bit intermediate
          const res =
            (Number(stack[sp - 1]) * Number(stack[sp])) / FP_ONE;
          stack[sp - 1] = toInt32(res);
          sp--;
        }
        break;
      case Op.DIV:
        if (sp >= 1) {
          if (stack[sp] === 0) stack[sp - 1] = 0;
          else {
            const res =
              (Number(stack[sp - 1]) * FP_ONE) / Number(stack[sp]);
            stack[sp - 1] = toInt32(res);
          }
          sp--;
        }
        break;
      case Op.MOD:
        if (sp >= 1 && stack[sp] !== 0) {
          stack[sp - 1] = stack[sp - 1] % stack[sp];
          sp--;
        } else if (sp >= 1) sp--;
        break;

      // Comparison
      case Op.LT:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] < stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.GT:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] > stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.LE:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] <= stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.GE:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] >= stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.EQ:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] === stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.NE:
        if (sp >= 1) {
          stack[sp - 1] = stack[sp - 1] !== stack[sp] ? FP_ONE : 0;
          sp--;
        }
        break;

      // Logic
      case Op.AND:
        if (sp >= 1) {
          stack[sp - 1] =
            stack[sp - 1] !== 0 && stack[sp] !== 0 ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.OR:
        if (sp >= 1) {
          stack[sp - 1] =
            stack[sp - 1] !== 0 || stack[sp] !== 0 ? FP_ONE : 0;
          sp--;
        }
        break;
      case Op.NOT:
        if (sp >= 0) {
          stack[sp] = stack[sp] === 0 ? FP_ONE : 0;
        }
        break;

      // Math (SIN/COS: firmware uses Q15.0 LUT, output = lut << 1)
      case Op.SIN:
        if (sp >= 0) {
          const idx = (stack[sp] >> 8) & 0xff;
          stack[sp] = toInt32(sinLut[idx] << 1);
        }
        break;
      case Op.COS:
        if (sp >= 0) {
          const idx = (stack[sp] >> 8) & 0xff;
          stack[sp] = toInt32(cosLut[idx] << 1);
        }
        break;
      case Op.MIN:
        if (sp >= 1) {
          stack[sp - 1] = Math.min(stack[sp - 1], stack[sp]);
          sp--;
        }
        break;
      case Op.MAX:
        if (sp >= 1) {
          stack[sp - 1] = Math.max(stack[sp - 1], stack[sp]);
          sp--;
        }
        break;
      case Op.ABS:
        if (sp >= 0) {
          stack[sp] = Math.abs(stack[sp]);
        }
        break;
      case Op.FLOOR:
        if (sp >= 0) {
          stack[sp] = stack[sp] & 0xffff0000;
        }
        break;
      case Op.ROUND:
        if (sp >= 0) {
          stack[sp] = toInt32(((stack[sp] + 0x8000) >> 16) << 16);
        }
        break;
      case Op.NOISE:
        if (sp >= 0) {
          stack[sp] = noise(stack[sp]);
        }
        break;
      case Op.CLAMP:
        if (sp >= 2) {
          const v = stack[sp - 2],
            l = stack[sp - 1],
            h = stack[sp];
          stack[sp - 2] = Math.max(l, Math.min(h, v));
          sp -= 2;
        }
        break;
      case Op.SELECT:
        if (sp >= 2) {
          const elseVal = stack[sp--];
          const thenVal = stack[sp--];
          const cond = stack[sp];
          stack[sp] = cond !== 0 ? thenVal : elseVal;
        }
        break;
      case Op.TAN:
        if (sp >= 0) {
          const x = stack[sp] / FP_ONE;
          const rad = 2.0 * Math.PI * x;
          stack[sp] = toInt32(
            Math.max(-2147483648, Math.min(2147483647, Math.tan(rad) * FP_ONE))
          );
        }
        break;
      case Op.CEIL:
        if (sp >= 0) {
          let v = stack[sp];
          if (v > 0 && (v & 0xffff) !== 0) v = ((v >> 16) + 1) << 16;
          else v = (v >> 16) << 16;
          stack[sp] = toInt32(v);
        }
        break;
      case Op.FRACT:
        if (sp >= 0) {
          stack[sp] = stack[sp] & 0xffff;
        }
        break;
      case Op.POW:
        if (sp >= 1) {
          const base = stack[sp - 1] / FP_ONE;
          const exp = stack[sp] / FP_ONE;
          stack[sp - 1] = toInt32(
            Math.max(
              -2147483648,
              Math.min(2147483647, Math.pow(base, exp) * FP_ONE)
            )
          );
          sp--;
        }
        break;
      case Op.SQRT:
        if (sp >= 0) {
          let x = stack[sp] / FP_ONE;
          if (x < 0) x = 0;
          stack[sp] = toInt32(Math.sqrt(x) * FP_ONE);
        }
        break;
      case Op.LERP:
        if (sp >= 2) {
          const a = stack[sp - 2];
          const b = stack[sp - 1];
          const t = stack[sp];
          stack[sp - 2] = toInt32(a + ((b - a) * t >> 16));
          sp -= 2;
        }
        break;

      // === Phase 1: Extended math ===
      case Op.NOISE2D:
        if (sp >= 1) { stack[sp - 1] = noise2D(stack[sp - 1], stack[sp]); sp--; }
        break;
      case Op.HASH:
        if (sp >= 0) { stack[sp] = hashFn(stack[sp]); }
        break;
      case Op.SMOOTHSTEP:
        if (sp >= 2) {
          const edge0 = stack[sp - 2], edge1 = stack[sp - 1], x = stack[sp];
          const range = edge1 - edge0;
          let tS: number;
          if (range === 0) { tS = (x >= edge0) ? FP_ONE : 0; }
          else { tS = toInt32(((x - edge0) * FP_ONE) / range); if (tS < 0) tS = 0; if (tS > FP_ONE) tS = FP_ONE; }
          const t2 = (tS * tS) / FP_ONE;
          stack[sp - 2] = toInt32((t2 * ((3 * FP_ONE) - 2 * tS)) / FP_ONE);
          sp -= 2;
        }
        break;
      case Op.STEP:
        if (sp >= 1) { stack[sp - 1] = (stack[sp] >= stack[sp - 1]) ? FP_ONE : 0; sp--; }
        break;
      case Op.MAP:
        if (sp >= 4) {
          const val = stack[sp - 4], inMin = stack[sp - 3], inMax = stack[sp - 2], outMin = stack[sp - 1], outMax = stack[sp];
          const inRange = inMax - inMin;
          if (inRange === 0) { stack[sp - 4] = outMin; }
          else { const tM = ((val - inMin) * FP_ONE) / inRange; stack[sp - 4] = toInt32(outMin + ((outMax - outMin) * tM) / FP_ONE); }
          sp -= 4;
        }
        break;
      case Op.EASE_IN:
        if (sp >= 0) { let x = stack[sp]; if (x < 0) x = 0; if (x > FP_ONE) x = FP_ONE; stack[sp] = toInt32((x * x) / FP_ONE); }
        break;
      case Op.EASE_OUT:
        if (sp >= 0) { let x = stack[sp]; if (x < 0) x = 0; if (x > FP_ONE) x = FP_ONE; const inv = FP_ONE - x; stack[sp] = toInt32(FP_ONE - (inv * inv) / FP_ONE); }
        break;
      case Op.EASE_INOUT:
        if (sp >= 0) {
          let x = stack[sp]; if (x < 0) x = 0; if (x > FP_ONE) x = FP_ONE;
          if (x < (FP_ONE >> 1)) { stack[sp] = toInt32((x * x) / (FP_ONE >> 1)); }
          else { let inv = (FP_ONE << 1) - (x << 1); if (inv < 0) inv = 0; stack[sp] = toInt32(FP_ONE - ((inv * inv) / FP_ONE >> 1)); }
        }
        break;
      case Op.BOUNCE:
        if (sp >= 0) {
          let x = stack[sp] / FP_ONE; if (x < 0) x = 0; if (x > 1) x = 1;
          let res: number;
          if (x < 1 / 2.75) { res = 7.5625 * x * x; }
          else if (x < 2 / 2.75) { x -= 1.5 / 2.75; res = 7.5625 * x * x + 0.75; }
          else if (x < 2.5 / 2.75) { x -= 2.25 / 2.75; res = 7.5625 * x * x + 0.9375; }
          else { x -= 2.625 / 2.75; res = 7.5625 * x * x + 0.984375; }
          stack[sp] = toInt32(res * FP_ONE);
        }
        break;
      case Op.ELASTIC:
        if (sp >= 0) {
          let x = stack[sp] / FP_ONE; if (x < 0) x = 0; if (x > 1) x = 1;
          let res: number;
          if (x <= 0) res = 0; else if (x >= 1) res = 1;
          else res = Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
          stack[sp] = toInt32(Math.max(0, Math.min(2 * FP_ONE, res * FP_ONE)));
        }
        break;

      // === Phase 2: State system extensions ===
      case Op.STATE_GET_OFFSET: {
        if (pc + 1 >= end) break;
        const stateIdx = bytecode[pc++];
        let offset = bytecode[pc++]; if (offset > 127) offset -= 256;
        let target = i + offset; if (target < 0) target = 0; if (target >= ledCount) target = ledCount - 1;
        stack[++sp] = (stateIdx < MAX_STATE_VARS && target < MAX_LEDS) ? svRead[target][stateIdx] : 0;
        break;
      }
      case Op.GLOBAL_GET: {
        if (pc >= end) break;
        const idx = bytecode[pc++];
        stack[++sp] = (engine && idx < MAX_GLOBAL_VARS) ? engine.globals[idx] : 0;
        break;
      }
      case Op.GLOBAL_SET: {
        if (pc >= end || sp < 0) break;
        const idx = bytecode[pc++];
        if (engine && idx < MAX_GLOBAL_VARS) engine.globals[idx] = stack[sp];
        sp--;
        break;
      }
      case Op.MIRROR:
        if (sp >= 0) { const frac = (stack[sp] >> 1) & 0xffff; let v = (frac << 1) - FP_ONE; if (v < 0) v = -v; stack[sp] = v; }
        break;
      case Op.REVERSE:
        if (sp >= 0) { stack[sp] = fpFromInt(ledCount - 1) - stack[sp]; }
        break;
      case Op.WRAP:
        if (sp >= 1) { let x = (stack[sp - 1] + stack[sp]) >> 16; if (ledCount > 0) x = ((x % ledCount) + ledCount) % ledCount; stack[sp - 1] = fpFromInt(x); sp--; }
        break;

      // === Phase 3: Event system ===
      case Op.PUSH_EVT_VAL: {
        if (pc >= end) break;
        const idx = bytecode[pc++];
        stack[++sp] = (engine && idx < MAX_EVENT_SLOTS) ? toInt32(engine.events[idx].val * FP_ONE) : 0;
        break;
      }
      case Op.PUSH_EVT_POS: {
        if (pc >= end) break;
        const idx = bytecode[pc++];
        stack[++sp] = (engine && idx < MAX_EVENT_SLOTS) ? toInt32(engine.events[idx].pos * FP_ONE) : 0;
        break;
      }
      case Op.PUSH_EVT_WIDTH: {
        if (pc >= end) break;
        const idx = bytecode[pc++];
        stack[++sp] = (engine && idx < MAX_EVENT_SLOTS) ? toInt32(engine.events[idx].width * FP_ONE) : 0;
        break;
      }

      // === Phase 4: Previous frame ===
      case Op.PUSH_PREV_R:
        stack[++sp] = (engine && i < MAX_LEDS && engine.prevFrame[i]) ? fpFromInt(engine.prevFrame[i][0]) : 0;
        break;
      case Op.PUSH_PREV_G:
        stack[++sp] = (engine && i < MAX_LEDS && engine.prevFrame[i]) ? fpFromInt(engine.prevFrame[i][1]) : 0;
        break;
      case Op.PUSH_PREV_B:
        stack[++sp] = (engine && i < MAX_LEDS && engine.prevFrame[i]) ? fpFromInt(engine.prevFrame[i][2]) : 0;
        break;

      // === Phase 5: Particles ===
      case Op.PUSH_PARTICLE_COUNT: {
        let count = 0;
        if (engine) { for (let p = 0; p < MAX_PARTICLES; p++) if (engine.particles[p]?.active) count++; }
        stack[++sp] = fpFromInt(count);
        break;
      }
      case Op.PUSH_PARTICLE_NEAR: {
        let totalIntensity = 0;
        if (engine) {
          for (let p = 0; p < MAX_PARTICLES; p++) {
            const part = engine.particles[p]; if (!part?.active) continue;
            const dist = Math.abs(part.x - i);
            if (dist < part.size) totalIntensity += toInt32((1 - dist / part.size) * part.life * FP_ONE);
          }
          if (totalIntensity > FP_ONE) totalIntensity = FP_ONE;
        }
        stack[++sp] = totalIntensity;
        break;
      }
      case Op.PUSH_PARTICLE_NEAR_R:
      case Op.PUSH_PARTICLE_NEAR_G:
      case Op.PUSH_PARTICLE_NEAR_B: {
        let tw = 0, ca = 0;
        const ch = (op === Op.PUSH_PARTICLE_NEAR_R) ? 0 : (op === Op.PUSH_PARTICLE_NEAR_G) ? 1 : 2;
        if (engine) {
          for (let p = 0; p < MAX_PARTICLES; p++) {
            const part = engine.particles[p]; if (!part?.active) continue;
            const dist = Math.abs(part.x - i);
            if (dist < part.size) { const w = (1 - dist / part.size) * part.life; tw += w; ca += w * (ch === 0 ? part.r : ch === 1 ? part.g : part.b); }
          }
        }
        stack[++sp] = fpFromInt(tw > 0.001 ? Math.min(255, Math.round(ca / tw)) : 0);
        break;
      }

      // === Phase 6: Temporal Echo ===
      case Op.TEMPORAL_ECHO_R:
      case Op.TEMPORAL_ECHO_G:
      case Op.TEMPORAL_ECHO_B: {
        if (sp >= 0 && engine) {
          const N = Math.max(0, Math.min(TEMPORAL_ECHO_DEPTH - 1, stack[sp] >> 16));
          const slot = ((engine.frameHistoryHead - N) % TEMPORAL_ECHO_DEPTH + TEMPORAL_ECHO_DEPTH) % TEMPORAL_ECHO_DEPTH;
          const ch = op === Op.TEMPORAL_ECHO_R ? 0 : op === Op.TEMPORAL_ECHO_G ? 1 : 2;
          const val = engine.frameHistory[slot]?.[i]?.[ch] ?? 0;
          stack[sp] = fpFromInt(val);
        } else if (sp >= 0) {
          stack[sp] = 0;
        }
        break;
      }

      // === Phase 7: Quantum Wave Collapse ===
      case Op.WAVE_COLLAPSE:
        if (sp >= 0) {
          const prob = stack[sp];
          const rand = toInt32(Math.random() * FP_ONE);
          stack[sp] = rand < prob ? FP_ONE : 0;
        }
        break;

      // === Phase 8: Field Flow Dynamics ===
      case Op.FIELD_GET:
        stack[++sp] = engine ? toInt32(engine.field[i] * FP_ONE) : 0;
        break;
      case Op.FIELD_SET:
        if (sp >= 0 && engine) {
          engine.field[i] = Math.max(0, Math.min(1, stack[sp] / FP_ONE));
          sp--;
        }
        break;

      // === Phase 9: Reaction-Threshold Propagation ===
      case Op.CHARGE_GET:
        stack[++sp] = engine ? toInt32(engine.charge[i] * FP_ONE) : 0;
        break;
      case Op.CHARGE_SET:
        if (sp >= 0 && engine) {
          engine.charge[i] = Math.max(0, stack[sp] / FP_ONE);
          sp--;
        }
        break;

      // === Phase 10: Cellular Automata (Wolfram CA) ===
      case Op.CA_RULE: {
        // Rule is popped from the stack (runtime-computed, e.g. from a parameter)
        if (sp < 0) break;
        const rule = Math.max(0, Math.min(255, stack[sp--] >> 16)); // integer part of Q16.16
        if (engine) {
          const left = (engine.prevFrame[i > 0 ? i - 1 : 0]?.[0] ?? 0) > 127 ? 1 : 0;
          const center = (engine.prevFrame[i]?.[0] ?? 0) > 127 ? 1 : 0;
          const right = (engine.prevFrame[i < ledCount - 1 ? i + 1 : ledCount - 1]?.[0] ?? 0) > 127 ? 1 : 0;
          const neighborhood = (left << 2) | (center << 1) | right;
          stack[++sp] = (rule >> neighborhood) & 1 ? FP_ONE : 0;
        } else {
          stack[++sp] = 0;
        }
        break;
      }

      // === Phase 4b: FM/PM Synthesis ===
      case Op.FMSIN: {
        if (sp >= 2) {
          const modDepth = stack[sp--]; // Q16.16 depth
          const modPhase = stack[sp--]; // Q16.16 phase input to modulator sin
          const carrPhase = stack[sp];   // Q16.16 phase input to carrier sin
          const modIdx = (modPhase >> 8) & 0xff;
          const modSig = toInt32(sinLut[modIdx] << 1); // Q16.16, -FP_ONE..FP_ONE
          // PM: carrier_phase + mod_depth * mod_signal
          const pmPhase = toInt32(carrPhase + (Number(modDepth) * Number(modSig) / FP_ONE));
          const carrIdx = (pmPhase >> 8) & 0xff;
          stack[sp] = toInt32(sinLut[carrIdx] << 1);
        }
        break;
      }

      // === Phase 1: Domain & Time Warping ===
      case Op.LOCAL_I_SET:
        if (sp >= 0) { localI_fp = stack[sp--]; }
        break;
      case Op.LOCAL_T_SET:
        // Takes seconds in Q16.16, converts to ms for internal use
        if (sp >= 0) { localT_ms = (stack[sp--] / FP_ONE) * 1000; }
        break;

      // State
      case Op.STATE_GET: {
        if (pc >= end) return layerOut;
        const si = bytecode[pc++];
        if (si < MAX_STATE_VARS && i < MAX_LEDS) {
          // Always read from live stateVars (not snapshot) for own pixel.
          // No other pixel writes to stateVars[i], so this equals snapshot at
          // frame start — but also reflects values written by STATE_SET earlier
          // in the same pixel's update_rules (sequential write-then-read works).
          // Cross-pixel directional bias is prevented by STATE_GET_OFFSET using svRead.
          stack[++sp] = stateVars[i][si];
        } else stack[++sp] = 0;
        break;
      }
      case Op.STATE_SET: {
        if (pc >= end || sp < 0) return layerOut;
        const si = bytecode[pc++];
        if (si < MAX_STATE_VARS && i < MAX_LEDS) {
          stateVars[i][si] = stack[sp];
        }
        sp--;
        break;
      }

      // Output
      case Op.OUT_R:
        if (sp >= 0) {
          // Q16.16 -> 0..255.
          const v = stack[sp] >> 16;
          layerOut.r = Math.max(0, Math.min(255, v));
          sp--;
        }
        break;
      case Op.OUT_G:
        if (sp >= 0) {
          const v = stack[sp] >> 16;
          layerOut.g = Math.max(0, Math.min(255, v));
          sp--;
        }
        break;
      case Op.OUT_B:
        if (sp >= 0) {
          const v = stack[sp] >> 16;
          layerOut.b = Math.max(0, Math.min(255, v));
          sp--;
        }
        break;
      case Op.OUT_BRIGHTNESS:
        if (sp >= 0) {
          const raw = stack[sp];
          const v = Math.round((raw * 255) / FP_ONE);
          layerOut.brightness = Math.max(0, Math.min(255, v));
          sp--;
        }
        break;
      case Op.OUT_OPACITY:
        if (sp >= 0) {
          const raw = stack[sp];
          const v = Math.round((raw * 255) / FP_ONE);
          layerOut.opacity = Math.max(0, Math.min(255, v));
          sp--;
        }
        break;
      case Op.OUT_SELECTOR:
        if (sp >= 0) {
          layerOut.active = stack[sp] !== 0;
          sp--;
        }
        break;
      case Op.HSV: {
        if (sp >= 2) {
          let v = stack[sp--] / FP_ONE;
          let s = stack[sp--] / FP_ONE;
          let h = stack[sp--] / FP_ONE;
          v = Math.max(0, Math.min(1, v));
          s = Math.max(0, Math.min(1, s));
          while (h < 0) h += 1;
          while (h > 1) h -= 1;
          let r: number, g: number, b: number;
          if (s <= 0) {
            r = g = b = v;
          } else {
            let hue = h * 6;
            if (hue >= 6) hue = 0;
            const i = Math.floor(hue);
            const f = hue - i;
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const t = v * (1 - s * (1 - f));
            switch (i) {
              case 0: r = v; g = t; b = p; break;
              case 1: r = q; g = v; b = p; break;
              case 2: r = p; g = v; b = t; break;
              case 3: r = p; g = q; b = v; break;
              case 4: r = t; g = p; b = v; break;
              default: r = v; g = p; b = q;
            }
          }
          stack[++sp] = toInt32(Math.round(r * 255) * 65536);
          stack[++sp] = toInt32(Math.round(g * 255) * 65536);
          stack[++sp] = toInt32(Math.round(b * 255) * 65536);
        }
        break;
      }

      default:
        break;
    }
  }
  return layerOut;
}

/** Apply blend mode: unchanged logic */
function applyBlend(
  layer: LayerOutput,
  blendMode: number,
  accum: { r: number; g: number; b: number }
): void {
  const r = (layer.r * layer.brightness) / 255;
  const g = (layer.g * layer.brightness) / 255;
  const b = (layer.b * layer.brightness) / 255;
  const opacity = layer.opacity;

  switch (blendMode) {
    case 0: // replace
      accum.r = Math.round(
        (r * opacity + accum.r * (255 - opacity)) / 255
      );
      accum.g = Math.round(
        (g * opacity + accum.g * (255 - opacity)) / 255
      );
      accum.b = Math.round(
        (b * opacity + accum.b * (255 - opacity)) / 255
      );
      break;
    case 1: // add
      accum.r = Math.min(255, accum.r + Math.round((r * opacity) / 255));
      accum.g = Math.min(255, accum.g + Math.round((g * opacity) / 255));
      accum.b = Math.min(255, accum.b + Math.round((b * opacity) / 255));
      break;
    case 2: // multiply
      accum.r = Math.round(
        (accum.r * ((r * opacity) / 255)) / 255
      );
      accum.g = Math.round(
        (accum.g * ((g * opacity) / 255)) / 255
      );
      accum.b = Math.round(
        (accum.b * ((b * opacity) / 255)) / 255
      );
      break;
    case 3: // screen
      accum.r = Math.round(
        255 -
        ((255 - accum.r) * (255 - (r * opacity) / 255)) / 255
      );
      accum.g = Math.round(
        255 -
        ((255 - accum.g) * (255 - (g * opacity) / 255)) / 255
      );
      accum.b = Math.round(
        255 -
        ((255 - accum.b) * (255 - (b * opacity) / 255)) / 255
      );
      break;
    default:
      accum.r = Math.round(
        (r * opacity + accum.r * (255 - opacity)) / 255
      );
      accum.g = Math.round(
        (g * opacity + accum.g * (255 - opacity)) / 255
      );
      accum.b = Math.round(
        (b * opacity + accum.b * (255 - opacity)) / 255
      );
  }
}

/** Helper: get instruction size for proper bytecode scanning (skip operand bytes) */
function instructionSize(op: number): number {
  switch (op) {
    case Op.PUSH_CONST: return 3;   // opcode + 2 bytes (Q8.8)
    case Op.PUSH_CONST32: return 5; // opcode + 4 bytes (Q16.16)
    case Op.PUSH_PARAM: return 2;   // opcode + 1 byte (param index)
    case Op.STATE_GET: return 2;
    case Op.STATE_SET: return 2;
    case Op.STATE_GET_OFFSET: return 3; // opcode + var index + signed offset
    case Op.GLOBAL_GET: return 2;
    case Op.GLOBAL_SET: return 2;
    case Op.PUSH_EVT_VAL: return 2;
    case Op.PUSH_EVT_POS: return 2;
    case Op.PUSH_EVT_WIDTH: return 2;
    case Op.LAYER_START: return 2;
    case Op.LAYER_END: return 2;
    case Op.CA_RULE: return 1; // rule popped from stack, no inline bytes
    default: return 1;
  }
}

/**
 * Execute full pixel with engine state.
 *
 * stateVarsSnapshot: a frozen copy of stateVars taken ONCE before the frame's
 * render loop begins. Passed to execSegment during update_rules so all pixels
 * see the same pre-frame state (proper double-buffering, prevents directional bias
 * in neighbour-diffusion patterns). If null, falls back to in-place behaviour.
 *
 * Callers should create a snapshot with createStateSnapshot() before looping
 * over pixels and pass the same snapshot instance for every pixel in the frame.
 */
export function execPixel(
  i: number,
  t: number,
  r: number,
  bytecode: Uint8Array,
  bytecodeLen: number,
  params: Float32Array,
  numParams: number,
  stateVars: Int32Array[],
  engine: SimulatorEngineState | null = null,
  stateVarsSnapshot: Int32Array[] | null = null
): { r: number; g: number; b: number } {
  const accum = { r: 0, g: 0, b: 0 };
  let hasLayers = false;
  for (let c = 0; c < bytecodeLen;) {
    const op = bytecode[c];
    if (op === Op.LAYER_START) { hasLayers = true; break; }
    if (op === Op.END) break;
    c += instructionSize(op);
  }

  if (!hasLayers) {
    const lo = execSegment(
      i, t, r, bytecode, 0, bytecodeLen,
      params, numParams, stateVars, MAX_LEDS, engine
    );
    applyBlend(lo, 0, accum);
    return accum;
  }

  let pc = 0;
  while (pc < bytecodeLen) {
    const op = bytecode[pc++];
    if (op === Op.LAYER_START) {
      if (pc >= bytecodeLen) break;
      pc++; // skip layer index
      const layerStart = pc;
      let layerEnd = layerStart;
      let depth = 1;
      while (layerEnd < bytecodeLen && depth > 0) {
        const scanOp = bytecode[layerEnd];
        if (scanOp === Op.LAYER_START) {
          depth++;
          layerEnd += instructionSize(scanOp);
        } else if (scanOp === Op.LAYER_END) {
          depth--;
          if (depth === 0) break;
          layerEnd += instructionSize(scanOp);
        } else if (scanOp === Op.END) {
          break;
        } else {
          layerEnd += instructionSize(scanOp);
        }
      }
      if (layerEnd >= bytecodeLen) break;
      const lo = execSegment(
        i, t, r, bytecode, layerStart, layerEnd,
        params, numParams, stateVars, MAX_LEDS, engine
      );
      pc = layerEnd + 1; // skip LAYER_END opcode
      if (pc >= bytecodeLen) break;
      const blendMode = bytecode[pc++];
      if (lo.active) applyBlend(lo, blendMode, accum);
      continue;
    }
    if (op === Op.UPDATE_START) {
      // Execute update_rules section: expressions that write to state vars via STATE_SET.
      // Runs as a segment — all opcodes including STATE_SET are handled by execSegment.
      let updateEnd = pc;
      while (updateEnd < bytecodeLen) {
        if (bytecode[updateEnd] === Op.UPDATE_END || bytecode[updateEnd] === Op.END) break;
        updateEnd += instructionSize(bytecode[updateEnd]);
      }
      // Execute the update rules segment (it will contain STATE_SET opcodes).
      // Pass stateVarsSnapshot as the read buffer so all pixels see the same
      // pre-frame state values — prevents directional bias in neighbour diffusion.
      execSegment(
        i, t, r, bytecode, pc, updateEnd,
        params, numParams, stateVars, MAX_LEDS, engine,
        stateVarsSnapshot
      );
      pc = updateEnd;
      if (pc < bytecodeLen && bytecode[pc] === Op.UPDATE_END) pc++; // skip UPDATE_END
      continue;
    }
    if (op === Op.END) break;
  }
  return accum;
}

export function disassemble(bytecode: Uint8Array, len: number): string {
  const lines: string[] = [];
  let pc = 0;
  while (pc < len) {
    const addr = pc;
    const op = bytecode[pc++];
    const name = OP_NAMES[op] || `UNK(0x${op.toString(16)})`;
    let extra = "";
    if (op === Op.PUSH_CONST && pc + 2 <= len) {
      let v = bytecode[pc] | (bytecode[pc + 1] << 8);
      if (v > 32767) v -= 65536;
      extra = ` ${v} (Float:${(v / 256).toFixed(3)})`;
      pc += 2;
    } else if (op === Op.PUSH_CONST32 && pc + 4 <= len) {
      const v =
        bytecode[pc] |
        (bytecode[pc + 1] << 8) |
        (bytecode[pc + 2] << 16) |
        (bytecode[pc + 3] << 24);
      extra = ` ${v} (Float:${(v / 65536).toFixed(3)})`;
      pc += 4;
    } else if (op === Op.PUSH_PARAM && pc < len) {
      extra = ` [${bytecode[pc++]}]`;
    } else if (op === Op.LAYER_START && pc < len) {
      extra = ` layer=${bytecode[pc++]}`;
    } else if (op === Op.LAYER_END && pc < len) {
      extra = ` blend=${bytecode[pc++]}`;
    } else if ((op === Op.STATE_GET || op === Op.STATE_SET) && pc < len) {
      extra = ` var=${bytecode[pc++]}`;
    } else if (op === Op.STATE_GET_OFFSET && pc + 1 < len) {
      const varIdx = bytecode[pc++];
      let offset = bytecode[pc++]; if (offset > 127) offset -= 256;
      extra = ` var=${varIdx} offset=${offset > 0 ? '+' : ''}${offset}`;
    } else if ((op === Op.GLOBAL_GET || op === Op.GLOBAL_SET) && pc < len) {
      extra = ` global=${bytecode[pc++]}`;
    } else if ((op === Op.PUSH_EVT_VAL || op === Op.PUSH_EVT_POS || op === Op.PUSH_EVT_WIDTH) && pc < len) {
      extra = ` slot=${bytecode[pc++]}`;
    }
    lines.push(`${String(addr).padStart(4)}: ${name}${extra}`);
    if (op === Op.END) break;
  }
  return lines.join("\n");
}

/**
 * Create a deep copy of stateVars to use as a read-only snapshot for the
 * current frame's update_rules pass. Call once per frame before the pixel
 * render loop and pass the result as stateVarsSnapshot to every execPixel call.
 *
 * Example (in your render loop):
 *   const snapshot = createStateSnapshot(stateVars);
 *   for (let i = 0; i < ledCount; i++) {
 *     const color = execPixel(i, t, r, bytecode, len, params, nParams, stateVars, engine, snapshot);
 *     ...
 *   }
 */
export function createStateSnapshot(stateVars: Int32Array[]): Int32Array[] {
  return stateVars.map(row => new Int32Array(row));
}

/** Create a fresh engine state */
export function createEngineState(ledCount: number): SimulatorEngineState {
  return {
    globals: new Float64Array(MAX_GLOBAL_VARS),
    events: Array.from({ length: MAX_EVENT_SLOTS }, () => ({ val: 0, pos: 0, width: 20, decay: 0.05 })),
    particles: Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0, vx: 0, life: 0, decay: 0.02, gravity: 0,
      r: 255, g: 255, b: 255, size: 5, active: false,
    })),
    prevFrame: Array.from({ length: ledCount }, () => new Uint8Array(3)),
    // Phase 6: Temporal Echo — pre-allocated ring buffer
    frameHistory: Array.from({ length: TEMPORAL_ECHO_DEPTH }, () =>
      Array.from({ length: ledCount }, () => new Uint8Array(3))
    ),
    frameHistoryHead: 0,
    // Phase 8: Field Flow Dynamics
    field: new Float32Array(ledCount),
    // Phase 9: Reaction-Threshold Propagation
    charge: new Float32Array(ledCount),
  };
}

/** Tick engine state per frame: decay events, update particle physics, evolve fields */
export function tickEngineState(engine: SimulatorEngineState, ledCount: number): void {
  // Events
  for (let e = 0; e < MAX_EVENT_SLOTS; e++) {
    const evt = engine.events[e];
    if (evt.val > 0) { evt.val -= evt.decay; if (evt.val < 0) evt.val = 0; }
  }

  // Particles
  for (let p = 0; p < MAX_PARTICLES; p++) {
    const part = engine.particles[p];
    if (!part.active) continue;
    part.life -= part.decay;
    if (part.life <= 0) { part.active = false; continue; }
    part.vx += part.gravity;
    part.x += part.vx;
    if (part.x < 0) { part.x = -part.x; part.vx = -part.vx * 0.7; }
    if (part.x >= ledCount) { part.x = 2 * ledCount - part.x - 2; part.vx = -part.vx * 0.7; }
  }

  // Phase 6: Temporal Echo — advance ring buffer, copy prevFrame into new slot
  const newHead = (engine.frameHistoryHead + 1) % TEMPORAL_ECHO_DEPTH;
  for (let j = 0; j < ledCount; j++) {
    const src = engine.prevFrame[j];
    const dst = engine.frameHistory[newHead][j];
    if (src && dst) { dst[0] = src[0]; dst[1] = src[1]; dst[2] = src[2]; }
  }
  engine.frameHistoryHead = newHead;

  // Phase 8: Field Flow Dynamics — 1D diffusion (Gaussian blur step, viscosity=0.08)
  if (engine.field.length >= ledCount) {
    const viscosity = 0.08;
    const tmp = new Float32Array(ledCount);
    for (let j = 0; j < ledCount; j++) {
      const l = engine.field[j > 0 ? j - 1 : 0];
      const c = engine.field[j];
      const r = engine.field[j < ledCount - 1 ? j + 1 : ledCount - 1];
      tmp[j] = c + viscosity * (l + r - 2 * c);
    }
    engine.field.set(tmp.subarray(0, ledCount));
  }

  // Phase 9: Reaction-Threshold Propagation — avalanche when charge ≥ 1.0
  if (engine.charge.length >= ledCount) {
    const chargeTransfer = 0.25;
    const chargeDecay = 0.002;
    const delta = new Float32Array(ledCount);
    for (let j = 0; j < ledCount; j++) {
      if (engine.charge[j] >= 1.0) {
        const pulse = engine.charge[j];
        delta[j] -= pulse; // reset self
        if (j > 0) delta[j - 1] += pulse * chargeTransfer;
        if (j < ledCount - 1) delta[j + 1] += pulse * chargeTransfer;
      } else {
        delta[j] -= chargeDecay; // natural slow decay
      }
    }
    for (let j = 0; j < ledCount; j++) {
      engine.charge[j] = Math.max(0, engine.charge[j] + delta[j]);
    }
  }
}
