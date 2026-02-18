/**
 * JS replica of ESP32 ExpressionExecutor — Q16.16 stack-based bytecode VM (Upgraded).
 * Replaces Q8.8 logic with 32-bit fixed point to solve overflow issues.
 */

// Q16.16 fixed-point (int32_t)
const FP_SHIFT = 16;
const FP_ONE = 1 << FP_SHIFT; // 65536
const fpFromInt = (x: number): number => x << FP_SHIFT;
const fpToInt = (x: number): number => x >> FP_SHIFT; // Truncates
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
  END: 0xff,
} as const;

const OP_NAMES: Record<number, string> = {};
for (const [k, v] of Object.entries(Op)) {
  OP_NAMES[v] = k;
}

const STACK_SIZE = 16;
const SIN_LUT_SIZE = 256;
export const MAX_LEDS = 300;
export const MAX_STATE_VARS = 5;
export const MAX_ANIM_PARAMS = 10;

// Sin/Cos LUTs: Q15.0 format (match firmware) — -32768..32767 for -1..1, then << 1 for Q16.16
const sinLut = new Int16Array(SIN_LUT_SIZE);
const cosLut = new Int16Array(SIN_LUT_SIZE);
for (let i = 0; i < SIN_LUT_SIZE; i++) {
  const rad = (2.0 * Math.PI * i) / SIN_LUT_SIZE;
  sinLut[i] = Math.max(-32768, Math.min(32767, Math.round(Math.sin(rad) * 32767)));
  cosLut[i] = Math.max(-32768, Math.min(32767, Math.round(Math.cos(rad) * 32767)));
}

// Noise: MUST match firmware (fast_hash + interpolate). Output 0..1 in Q16.16.
function hash(n: number): number {
  let s = n >>> 0;
  s = (((s >>> 16) ^ s) * 0x45d9f3b) >>> 0;
  s = (((s >>> 16) ^ s) * 0x45d9f3b) >>> 0;
  s = ((s >>> 16) ^ s) >>> 0;
  return s & 0xff; // 0..255 raw
}

function noise(x: number): number {
  const xi = x >> 16;
  const xf = x & 0xffff;
  const v1 = hash(xi);
  const v2 = hash(xi + 1);
  const res = v1 + Math.round(((v2 - v1) * xf) / 65536); // 0..255
  return toInt32(Math.floor((res * 65536) / 255)); // 0..1 in Q16.16
}

import type { LayerOutput } from "./types";

/**
 * Execute a bytecode segment.
 * Returns { r, g, b, brightness, opacity, active }
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
  ledCount: number
): LayerOutput {
  const stack = new Int32Array(STACK_SIZE); // 32-bit stack
  let sp = -1;
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
        stack[++sp] = fpFromInt(i); // i in Q16.16
        break;

      case Op.PUSH_T: {
        // FIXED BEHAVIOR: t (ms) converted to seconds in Q16.16
        // t=1000ms -> 1.0 -> 65536
        const tSec = t / 1000.0;
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

      // State
      case Op.STATE_GET: {
        if (pc >= end) return layerOut;
        const si = bytecode[pc++];
        if (si < MAX_STATE_VARS && i < MAX_LEDS) {
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
    case Op.STATE_GET: return 2;    // opcode + 1 byte (state var index)
    case Op.STATE_SET: return 2;    // opcode + 1 byte (state var index)
    case Op.LAYER_START: return 2;  // opcode + 1 byte (layer index)
    case Op.LAYER_END: return 2;    // opcode + 1 byte (blend mode)
    default: return 1;              // single-byte opcode
  }
}

/** Match execPixel signature */
export function execPixel(
  i: number,
  t: number,
  r: number,
  bytecode: Uint8Array,
  bytecodeLen: number,
  params: Float32Array,
  numParams: number,
  stateVars: Int32Array[]
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
      params, numParams, stateVars, MAX_LEDS
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
        params, numParams, stateVars, MAX_LEDS
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
      // Execute the update rules segment (it will contain STATE_SET opcodes)
      execSegment(
        i, t, r, bytecode, pc, updateEnd,
        params, numParams, stateVars, MAX_LEDS
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
    } else if (
      (op === Op.STATE_GET || op === Op.STATE_SET) &&
      pc < len
    ) {
      extra = ` var=${bytecode[pc++]}`;
    }
    lines.push(`${String(addr).padStart(4)}: ${name}${extra}`);
    if (op === Op.END) break;
  }
  return lines.join("\n");
}
