import type { AnimationDefinition } from "../../../types/animation";

/** Default empty animation (one layer, black) */
export const EMPTY_ANIMATION: AnimationDefinition = {
  engineVersion: "32.0",
  name: "new_animation",
  ledCount: 300,
  fps: 30,
  brightness: 200,
  parameters: {},
  layers: [
    {
      name: "layer_0",
      selector: "1",
      color: { r: "0", g: "0", b: "0" },
      brightness: "1",
      opacity: "1",
      blend: "replace",
    },
  ],
};

/** Пресеты для быстрого старта */
export const PRESETS: { name: string; def: AnimationDefinition }[] = [
  {
    name: "Пустая",
    def: { ...EMPTY_ANIMATION },
  },
  {
    name: "Радужная волна",
    def: {
      engineVersion: "32.0",
      name: "rainbow_wave",
      ledCount: 300,
      fps: 30,
      brightness: 200,
      parameters: { speed: 0.3 },
      layers: [
        {
          name: "wave",
          selector: "1",
          color: {
            r: "127 + 127*sin(i/ledCount + t*speed)",
            g: "127 + 127*sin(i/ledCount + t*speed + 0.33)",
            b: "127 + 127*sin(i/ledCount + t*speed + 0.67)",
          },
          brightness: "1",
          opacity: "1",
          blend: "replace",
        },
      ],
    },
  },
  {
    name: "Огонь",
    def: {
      engineVersion: "32.0",
      name: "fire",
      ledCount: 300,
      fps: 30,
      brightness: 200,
      parameters: { intensity: 1.5 },
      layers: [
        {
          name: "fire",
          selector: "1",
          color: {
            r: "255",
            g: "noise(i*0.1 + t*intensity) * 120",
            b: "0",
          },
          brightness: "1",
          opacity: "1",
          blend: "replace",
        },
      ],
    },
  },
  {
    name: "Искры (noise)",
    def: {
      engineVersion: "32.0",
      name: "sparkles",
      ledCount: 300,
      fps: 30,
      brightness: 200,
      parameters: {},
      layers: [
        {
          name: "sparkles",
          selector: "noise(i*0.5 + t*2) > 0.94",
          color: { r: "255", g: "255", b: "255" },
          brightness: "1",
          opacity: "1",
          blend: "replace",
        },
      ],
    },
  },
  {
    name: "Шум",
    def: {
      engineVersion: "32.0",
      name: "noise_anim",
      ledCount: 300,
      fps: 30,
      brightness: 200,
      parameters: { speed: 0.5 },
      layers: [
        {
          name: "noise",
          selector: "1",
          color: {
            r: "noise(i*0.1 + t*speed) * 255",
            g: "noise(i*0.1 + t*speed + 100) * 255",
            b: "noise(i*0.1 + t*speed + 200) * 255",
          },
          brightness: "1",
          opacity: "1",
          blend: "replace",
        },
      ],
    },
  },
  {
    name: "Trail (след)",
    def: {
      engineVersion: "32.0",
      name: "trail",
      ledCount: 300,
      fps: 30,
      brightness: 200,
      parameters: { decay: 0.92 },
      layers: [
        {
          name: "trail",
          selector: "1",
          color: {
            r: "prev_r * decay",
            g: "prev_g * decay",
            b: "prev_b * decay",
          },
          brightness: "1",
          opacity: "1",
          blend: "replace",
        },
        {
          name: "head",
          selector: "1",
          color: {
            r: "255 * (0.5 + 0.5*sin(t*2))",
            g: "100",
            b: "50",
          },
          brightness: "1",
          opacity: "1",
          blend: "add",
        },
      ],
    },
  },
];

/** localStorage key for last edited animation IDs */
export const LAST_EDITED_IDS_KEY = "animation-constructor-last-edited";

/** Max IDs to store */
export const MAX_LAST_EDITED = 10;
