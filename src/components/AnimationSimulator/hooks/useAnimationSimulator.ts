import { useState, useEffect, useRef, useCallback } from "react";
import {
  execPixel,
  createStateSnapshot,
  MAX_LEDS,
  MAX_ANIM_PARAMS,
  MAX_STATE_VARS,
  createEngineState,
  tickEngineState,
} from "../engine";
import type { SimulatorEngineState } from "../engine";
import type {
  AnimationData,
  LED,
  PixelHistory,
} from "../types";

const MAX_HISTORY = 200;

interface UseAnimationSimulatorProps {
  animationBody: {
    ledCount: number;
    fps: number;
    brightness: number;
    numParams: number;
    bytecode: string;
    paramNames: string[];
    paramDefaults: number[];
  } | null;
}

export function useAnimationSimulator({
  animationBody,
}: UseAnimationSimulatorProps) {
  const [animData, setAnimData] = useState<AnimationData | null>(null);
  const [stateVars, setStateVars] = useState<Int32Array[]>([]);
  const [params, setParams] = useState<Float32Array>(
    new Float32Array(MAX_ANIM_PARAMS)
  );
  const engineStateRef = useRef<SimulatorEngineState | null>(null);
  const [leds, setLeds] = useState<LED[]>([]);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentT, setCurrentT] = useState(0);
  const [selectedPixel, setSelectedPixel] = useState(-1);
  const [pixelHistory, setPixelHistory] = useState<PixelHistory[]>([]);
  const [fps, setFps] = useState(0);

  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize animation data
  useEffect(() => {
    if (!animationBody) {
      // Cleanup on unmount or when animation is removed
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setAnimData(null);
      setPlaying(false);
      setPaused(false);
      setLeds([]);
      setPixelHistory([]);
      setSelectedPixel(-1);
      setCurrentT(0);
      setFps(0);
      return;
    }

    const bcStr = animationBody.bytecode;
    if (!bcStr) return;

    const raw = atob(bcStr);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

    const newAnimData: AnimationData = {
      ledCount: Math.min(animationBody.ledCount || 300, MAX_LEDS),
      fps: animationBody.fps || 30,
      brightness: animationBody.brightness || 200,
      numParams: animationBody.numParams || 0,
      bytecodeArr: arr,
      paramNames: animationBody.paramNames || [],
      paramDefaults: animationBody.paramDefaults || [],
    };

    const newStateVars = Array.from({ length: MAX_LEDS }, () =>
      new Int32Array(MAX_STATE_VARS)
    );
    const newParams = new Float32Array(MAX_ANIM_PARAMS);
    for (
      let i = 0;
      i < newAnimData.numParams && i < MAX_ANIM_PARAMS;
      i++
    ) {
      newParams[i] = newAnimData.paramDefaults[i] || 0;
    }
    const newLeds = Array.from({ length: newAnimData.ledCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
    }));

    // Stop any running animation before loading new one
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    engineStateRef.current = createEngineState(newAnimData.ledCount);
    setAnimData(newAnimData);
    setStateVars(newStateVars);
    setParams(newParams);
    setLeds(newLeds);
    setPixelHistory([]);
    setSelectedPixel(-1);
    setCurrentT(0);
    setPlaying(false);
    setPaused(false);
    setFps(0);
  }, [animationBody]);

  // Update params when animation body changes
  useEffect(() => {
    if (!animData || !animationBody) return;

    const newParams = new Float32Array(MAX_ANIM_PARAMS);
    for (let i = 0; i < animData.numParams && i < MAX_ANIM_PARAMS; i++) {
      newParams[i] = animationBody.paramDefaults[i] || 0;
    }
    setParams(newParams);
  }, [animData, animationBody?.paramDefaults]);

  // Render frame
  const renderFrame = useCallback(
    (t: number) => {
      if (!animData) return;

      const bc = animData.bytecodeArr;
      const nLeds = animData.ledCount;
      const engine = engineStateRef.current;
      const newLeds: LED[] = [];

      // Tick engine state (decay events, update particles)
      if (engine) tickEngineState(engine, nLeds);

      // Snapshot of stateVars taken BEFORE the pixel loop so every pixel's
      // update_rules reads the same pre-frame state (fixes directional bias
      // in neighbour-diffusion animations like smoke, reaction-diffusion).
      const stateSnapshot = createStateSnapshot(stateVars);

      for (let i = 0; i < nLeds; i++) {
        const rnd = Math.floor(Math.random() * 256);
        const out = execPixel(
          i, t, rnd, bc, bc.length,
          params, animData.numParams, stateVars, engine, stateSnapshot
        );
        newLeds.push({ r: out.r, g: out.g, b: out.b });
      }

      // Save prevFrame for next frame
      if (engine) {
        for (let i = 0; i < nLeds; i++) {
          engine.prevFrame[i][0] = newLeds[i].r;
          engine.prevFrame[i][1] = newLeds[i].g;
          engine.prevFrame[i][2] = newLeds[i].b;
        }
      }

      setLeds(newLeds);
      setCurrentT(t);

      // Update pixel history if pixel is selected
      if (selectedPixel >= 0 && selectedPixel < nLeds) {
        const led = newLeds[selectedPixel];
        setPixelHistory((prev) => {
          const newHistory = [
            ...prev,
            { t, r: led.r, g: led.g, b: led.b },
          ];
          return newHistory.length > MAX_HISTORY
            ? newHistory.slice(-MAX_HISTORY)
            : newHistory;
        });
      }
    },
    [animData, params, stateVars, selectedPixel]
  );

  // Render loop
  useEffect(() => {
    if (!playing || paused || !animData) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (!playing || paused) return;

      const t = Math.round(timestamp - startTimeRef.current);
      renderFrame(t);

      frameCountRef.current++;
      if (timestamp - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = timestamp;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    startTimeRef.current = performance.now() - currentT;
    lastFpsTimeRef.current = startTimeRef.current;
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [playing, paused, animData, currentT, renderFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, []);

  const loadAndPlay = useCallback(() => {
    if (!animData) return;
    setPixelHistory([]);
    startTimeRef.current = performance.now();
    setCurrentT(0);
    frameCountRef.current = 0;
    lastFpsTimeRef.current = startTimeRef.current;
    setPlaying(true);
    setPaused(false);
  }, [animData]);

  const togglePause = useCallback(() => {
    if (!playing) return;
    setPaused((prev) => {
      if (!prev) {
        startTimeRef.current = performance.now() - currentT;
      }
      return !prev;
    });
  }, [playing, currentT]);

  const stepFrame = useCallback(() => {
    if (!animData) return;
    setPaused(true);
    setPlaying(true);
    const newT = currentT + Math.round(1000 / animData.fps);
    renderFrame(newT);
  }, [animData, currentT, renderFrame]);

  const stopAnim = useCallback(() => {
    setPlaying(false);
    setPaused(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, []);

  const updateParam = useCallback(
    (index: number, value: number) => {
      if (!animData || index >= animData.numParams) return;
      const newParams = new Float32Array(params);
      newParams[index] = value;
      setParams(newParams);
    },
    [animData, params]
  );

  const fireEvent = useCallback(
    (slot: number, val = 1.0, pos = 0, width = 20, decay = 0.05) => {
      const engine = engineStateRef.current;
      if (!engine || slot < 0 || slot >= 4) return;
      engine.events[slot] = { val, pos, width, decay, mode: 0 };
    },
    []
  );

  const spawnParticle = useCallback(
    (opts: { x?: number; vx?: number; life?: number; decay?: number; gravity?: number; r?: number; g?: number; b?: number; size?: number } = {}) => {
      const engine = engineStateRef.current;
      if (!engine) return;
      const free = engine.particles.find((p) => !p.active);
      if (!free) return;
      free.x = opts.x ?? 0;
      free.vx = opts.vx ?? 0;
      free.life = opts.life ?? 1.0;
      free.decay = opts.decay ?? 0.02;
      free.gravity = opts.gravity ?? 0;
      free.r = opts.r ?? 255;
      free.g = opts.g ?? 255;
      free.b = opts.b ?? 255;
      free.size = opts.size ?? 5;
      free.active = true;
    },
    []
  );

  return {
    animData,
    leds,
    playing,
    paused,
    currentT,
    selectedPixel,
    setSelectedPixel,
    pixelHistory,
    fps,
    loadAndPlay,
    togglePause,
    stepFrame,
    stopAnim,
    updateParam,
    fireEvent,
    spawnParticle,
  };
}
