# Animation Engine Refactoring — BMad Implementation Plan

**Source:** [animation-engine-refactoring.md](./animation-engine-refactoring.md)  
**Format:** BMad (Breakthrough Method of Agile AI Driven Development)  
**Phase:** Solutioning → Implementation (Phase 3–4)

---

## Epic: Universal ESP32 WS2812B Animation Engine

**Goal:** Replace the old animation system with a universal engine that interprets LLM-generated JSON. The rest of the firmware (OTA, Wi‑Fi, WebSocket, indicators) remains unchanged.

**Scope:** ESP32-WROOM-32, 300 LEDs WS2812B, Node.js + Express + WebSocket backend, Prisma + MongoDB.

**Out of scope / Do not touch:** OTA logic, progress bar during OTA, Wi‑Fi/connection indicators, "Engine Started" indicator, device init and non-animation code.

---

## Story 1: Core Expression Parser and Evaluator

**Implementation Order:** 1  
**Depends on:** —  
**Deliverable:** Safe, fast expression parser and evaluator for `expr` per-LED per-frame.

### Acceptance Criteria

- **AC1.1** Parser accepts an `expr` string and builds AST without crashing on invalid input; parse errors are handled safely.
- **AC1.2** All built-in functions from the spec are supported: math (sin, cos, tan, atan2, abs, floor, ceil, round, fract, pow, sqrt, min, max, clamp, lerp, map), logic (if, select, ternary), geometry (distance, dist_from_center), time (time, beat, pulse, fract), color (hsv, rgb, hsv_bright, rgb_bright, blend), palette (palette_index), noise (perlin_noise, random), easing (linear, easeInQuad, easeOutQuad, easeInOutQuad, easeOutExpo, easeOutBounce).
- **AC1.3** Evaluation context: `pos` 0.0–1.0, access to `params`, `time`; expression returns a color or `{ color, brightness }`.
- **AC1.4** On expr runtime error for a given LED, return black pixel; layer does not crash.
- **AC1.5** Color formats supported: `#rrggbb`, `[r,g,b]` 0–255 or 0–1, `{h,s,v}`, `rgb(...)`, `hsv(...)`.

### Tasks

- [ ] **T1.1** (AC1.1) Implement expression lexer/parser with memory and timeout bounds.
- [ ] **T1.2** (AC1.2) Implement all built-in functions and operators per the plan list.
- [ ] **T1.3** (AC1.3) Introduce context (pos, time, params) and interface evaluate(expr, context) → color | {color, brightness}.
- [ ] **T1.4** (AC1.4) Wrap evaluate in try/catch; on error return black for that LED.
- [ ] **T1.5** (AC1.5) Implement parsing and normalization of all color formats into a single internal format.

### Dev Notes / References

- Plan: Animation JSON Format, Expression Language (expr).
- Target: 60 fps, 300 LEDs; minimize allocations in the render loop.

---

## Story 2: Layer Rendering Pipeline (Blend + Opacity)

**Implementation Order:** 2  
**Depends on:** Story 1  
**Deliverable:** Render up to 6 layers with opacity and blend modes.

### Acceptance Criteria

- **AC2.1** Each layer: `name` (optional), `opacity` 0.0–1.0, `blend` (normal, add, screen, multiply, overlay, lighten), `expr` — evaluated via engine from Story 1.
- **AC2.2** expr result (color or `{color, brightness}`) is applied to the pixel; brightness is applied before blending.
- **AC2.3** Layers are combined in order with opacity and blend mode; final buffer is one RGB per LED.
- **AC2.4** `master_brightness` and `master_opacity` are applied to the final frame.
- **AC2.5** Partial load: only successfully parsed layers are rendered; broken layers are skipped.

### Tasks

- [ ] **T2.1** (AC2.1) Layer structure and evaluator call per LED per layer.
- [ ] **T2.2** (AC2.2) Handle return value `{color, brightness}` and apply brightness to color.
- [ ] **T2.3** (AC2.3) Implement all 6 blend modes and opacity application.
- [ ] **T2.4** (AC2.4) Final pass: master_brightness, master_opacity.
- [ ] **T2.5** (AC2.5) Validate layers on load; render only valid layers, log failed ones.

### Dev Notes / References

- Plan: layers array, blend modes, color formats.
- Memory: one buffer per layer or double-buffer as needed for ESP32.

---

## Story 3: Full Animation JSON Loader and Validator

**Implementation Order:** 3  
**Depends on:** Story 1, Story 2  
**Deliverable:** Load and validate full animation JSON per specification.

### Acceptance Criteria

- **AC3.1** Root validation: version, title, description, author, generatedBy, generationPrompt, labels (4–10), usedColors (3–15, #rrggbb), fps (default 60), loop, master_brightness (default 0.85), master_opacity (default 1.0), params, paramDescriptions, layers (max 6).
- **AC3.2** params: numbers, hex strings, and optional `palette` array of hex strings only; paramDescriptions keys match params, values have description and optionally effect, range, recommended.
- **AC3.3** Each layer is validated for opacity, blend, expr; invalid layers are marked and excluded from render (partial load).
- **AC3.4** JSON size up to ~12 KB is supported on target ESP32 without buffer overflow.
- **AC3.5** On invalid JSON or no animation ever loaded — switch to fallback (orange pulse).

### Tasks

- [ ] **T3.1** (AC3.1, AC3.2) Parse JSON and validate all root fields and types.
- [ ] **T3.2** (AC3.3) Validate each layer; list of valid layer indices.
- [ ] **T3.3** (AC3.4) Cap incoming JSON size and parse in chunks/stream if needed.
- [ ] **T3.4** (AC3.5) "No valid animation loaded" flag and fallback mode invocation.

### Dev Notes / References

- Plan: Animation JSON Format (Exact Specification).
- Backend already serves full JSON; device receives it via WebSocket or HTTP.

---

## Story 4: Parameter Interpolation (transition_time)

**Implementation Order:** 4  
**Depends on:** Story 3  
**Deliverable:** Smooth parameter changes over transition_time using easeInOutQuad.

### Acceptance Criteria

- **AC4.1** Command `params_update` with `params` and optional `transition_time` (default 0.5 s).
- **AC4.2** Current params are interpolated to target over transition_time using easeInOutQuad.
- **AC4.3** During interpolation each frame receives current interpolated params for the evaluator.
- **AC4.4** A new params_update before transition ends overwrites target and, if needed, start point/time.

### Tasks

- [ ] **T4.1** (AC4.1) Handle params_update in WebSocket handler (see Story 5); store target params and transition_time.
- [ ] **T4.2** (AC4.2) Implement easeInOutQuad and time-based interpolation; update current params each frame.
- [ ] **T4.3** (AC4.3) Pass current (interpolated) params into expression engine context.
- [ ] **T4.4** (AC4.4) On new params_update during transition: update target and time correctly.

### Dev Notes / References

- Plan: params_update, Parameter interpolation system.
- Ease formula: standard easeInOutQuad (0,0 → 0.5,0.5 → 1,1).

---

## Story 5: WebSocket Command Handler (New Message Types)

**Implementation Order:** 5  
**Depends on:** Story 3, Story 4  
**Deliverable:** Handle all animation protocol commands and responses over WebSocket.

### Acceptance Criteria

- **AC5.1** Server → Device: handle `animation_load` (full JSON), `params_update`, `master_update` (master_brightness, master_opacity), `pause`, `resume`, `stop`, `ping`.
- **AC5.2** Device → Server: on connect — `connected`; on commands — `ack`; on errors — `error` (stage, layer, message); periodically and on state change — `status`.
- **AC5.3** pause: freeze time, current frame stays on strip; optionally lower FPS for power saving.
- **AC5.4** resume: continue from the same time.
- **AC5.5** stop: return to fallback animation (orange pulse if no load ever; otherwise "no active animation" → same fallback).
- **AC5.6** Existing WebSocket logic (reconnect, heartbeat) is not removed or broken.

### Tasks

- [ ] **T5.1** (AC5.1) Route by `type`; call loader for animation*load, interpolator for params_update, set master*\* for master_update, pause/resume/stop.
- [ ] **T5.2** (AC5.2) Build and send connected, ack, error, status in unified JSON format.
- [ ] **T5.3** (AC5.3, AC5.4) Paused flag and freeze global time; resume clears flag.
- [ ] **T5.4** (AC5.5) stop clears current animation and switches render to fallback.
- [ ] **T5.5** (AC5.6) Integrate into existing WebSocket handler without removing OTA/Wi‑Fi/Engine Started code.

### Dev Notes / References

- Plan: WebSocket Protocol (Exact).
- Code preservation: do not touch reconnect, heartbeat, or other non-animation message types.

---

## Story 6: Fallback Animation (Orange / Red Pulse)

**Implementation Order:** 6  
**Depends on:** Story 2 (single "layer" render)  
**Deliverable:** Default mode when no animation is loaded or on critical error.

### Acceptance Criteria

- **AC6.1** No animation ever loaded successfully → entire strip warm orange #FF6200 with smooth 4 s pulse (easeInOutQuad), 30 fps.
- **AC6.2** Critical engine failure → same pulse but bright red #FF1A1A.
- **AC6.3** Pulse does not block receiving animation_load and other commands; after successful load fallback is turned off.

### Tasks

- [ ] **T6.1** (AC6.1) Implement simple render: color + sine/ease over time, 4 s cycle, 30 fps.
- [ ] **T6.2** (AC6.2) Switch color to red when "critical engine failure" flag is set.
- [ ] **T6.3** (AC6.3) Choose between fallback and main engine by "valid animation loaded" flag; fallback does not handle layers.

### Dev Notes / References

- Plan: Fallback / Error Behavior.
- Integration with "Engine Started" at strip end: fallback only draws its LEDs, does not overwrite service zones.

---

## Story 7: Error Handling and Detailed Reporting over WS

**Implementation Order:** 7  
**Depends on:** Story 3, Story 5  
**Deliverable:** Detailed parse/runtime errors and sending them to the server.

### Acceptance Criteria

- **AC7.1** On JSON parse or validation error — send `error` with stage (e.g. "load", "parse", "validate"), optional layer (index), message (text).
- **AC7.2** On critical engine error (e.g. out of memory during render) — set flag for red fallback and send error.
- **AC7.3** expr runtime errors are not sent one-by-one (no spam); aggregate error or counter in status if needed.
- **AC7.4** Device does not reboot or crash on any animation code error; only fallback and report.

### Tasks

- [ ] **T7.1** (AC7.1) At parse/validation points call sendError(stage, layer?, message).
- [ ] **T7.2** (AC7.2) Handle critical exceptions: failure flag + red fallback + error.
- [ ] **T7.3** (AC7.3) Decide on aggregating expr runtime errors (e.g. counter in status every N seconds).
- [ ] **T7.4** (AC7.4) Wrappers and guards: all engine calls in try/catch; global watchdog only if desired, without changing plan requirements.

### Dev Notes / References

- Plan: Fallback / Error Behavior; WebSocket Protocol — error message.

---

## Story 8: Integration with Existing FastLED/NeoPixelBus

**Implementation Order:** 8  
**Depends on:** Story 2, Story 6  
**Deliverable:** Engine output into existing strip buffer without removing OTA/Wi‑Fi/indicators.

### Acceptance Criteria

- **AC8.1** Final frame (after master_brightness/opacity) is written to the buffer used by current strip implementation (FastLED or NeoPixelBus); zones for OTA progress, connection, "Engine Started" are not overwritten by the animation engine.
- **AC8.2** Strip refresh rate matches animation fps (default 60) or 30 for fallback; no extra delay.
- **AC8.3** Engine is invoked from main loop only when animation is active (not OTA, not other mode); during OTA existing progress bar logic remains.
- **AC8.4** Strip init code, length, pins are unchanged in non-animation parts.

### Tasks

- [ ] **T8.1** (AC8.1) Define LED ranges for animation and service zones; write frame only to animation range.
- [ ] **T8.2** (AC8.2) Timing: call render in loop at fps; on pause — reduced fps per plan.
- [ ] **T8.3** (AC8.3) Invocation condition: animation active and not OTA; otherwise existing draw logic.
- [ ] **T8.4** (AC8.4) Code review for no changes to OTA/Wi‑Fi/Engine Started code.

### Dev Notes / References

- Plan: Code Preservation Requirements; Integration with existing FastLED/NeoPixelBus setup.
- Existing strip code remains the single source of truth for strip length and type.

---

## Story 9: Prisma Schema and Backend Adjustments

**Implementation Order:** 9  
**Depends on:** — (can run in parallel with firmware after JSON format is agreed)  
**Deliverable:** New DB schema and backend for the new animation model.

### Acceptance Criteria

- **AC9.1** Animation model: all root fields (title, description, author, generatedBy, generationPrompt, labels, usedColors, fps, loop, master_brightness, master_opacity, params, paramDescriptions, layers), full storage of original JSON for audit, relation to User via author (ObjectId), timestamps.
- **AC9.2** Indexes for fast search by labels, usedColors, author, generatedBy.
- **AC9.3** Old animation collections are cleared by the user; backend after migration uses only the new schema via existing Prisma client.
- **AC9.4** Animation upload/serve API (and send-to-device) work with the new JSON format without breaking existing endpoints where applicable.

### Tasks

- [ ] **T9.1** (AC9.1) Write/rewrite Prisma schema for Animation and relations.
- [ ] **T9.2** (AC9.2) Add indexes in schema; run migrations if needed.
- [ ] **T9.3** (AC9.3) Migration and verification: old data cleared per instructions; all queries via Prisma.
- [ ] **T9.4** (AC9.4) Update services that create/read animations (LLM generation, GET body, send-to-device) for the new format.

### Dev Notes / References

- Plan: Database & Prisma Requirements.
- API_DOCUMENTATION.md in repo for current endpoints.

---

## Story 10: Full Testing with Real LLM-Generated Animations

**Implementation Order:** 10  
**Depends on:** Stories 1–8 (firmware), Story 9 (backend)  
**Deliverable:** Stable operation on target device with real LLM-generated animations.

### Acceptance Criteria

- **AC10.1** On ESP32 target: stable 60 fps with up to 6 layers and JSON up to 12 KB.
- **AC10.2** Verify: load animation via WebSocket, params change with transition_time, pause/resume/stop, fallback on error and when no load.
- **AC10.3** Verify: OTA still works, progress bar on strip, Wi‑Fi and "Engine Started" indicators in place.
- **AC10.4** Several real LLM-generated animations run full cycle: create in backend → send to device → playback without crashes.

### Tasks

- [ ] **T10.1** (AC10.1) Profile and optimize if needed (memory, render loop) for 60 fps, 6 layers, 12 KB.
- [ ] **T10.2** (AC10.2) WebSocket scenario checklist and manual/automated verification.
- [ ] **T10.3** (AC10.3) Regression: OTA, indicators — no behavior change.
- [ ] **T10.4** (AC10.4) Set of 3–5 different LLM animations; run on device and record results.

### Dev Notes / References

- Plan: Full testing with real LLM-generated animations; final firmware must run at 60 fps reliably.
- Use existing animation creation pipeline (POST /api/animations etc.).

---

## Summary: Sequencing and Dependencies

| Order | Story                                    | Depends on        |
| ----- | ---------------------------------------- | ----------------- |
| 1     | Core Expression Parser and Evaluator     | —                 |
| 2     | Layer Rendering Pipeline                 | 1                 |
| 3     | Full Animation JSON Loader and Validator | 1, 2              |
| 4     | Parameter Interpolation                  | 3                 |
| 5     | WebSocket Command Handler                | 3, 4              |
| 6     | Fallback Animation                       | 2                 |
| 7     | Error Handling and Reporting over WS     | 3, 5              |
| 8     | Integration with FastLED/NeoPixelBus     | 2, 6              |
| 9     | Prisma Schema and Backend                | — (format agreed) |
| 10    | Full Testing with LLM Animations         | 1–8, 9            |

**Code preservation (all stories):** do not touch OTA, Wi‑Fi, WebSocket reconnect/heartbeat, "Engine Started", device init, or any non-animation code. Only the old animation render path is replaced.
