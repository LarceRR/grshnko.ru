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

/** localStorage key for last edited animation IDs */
export const LAST_EDITED_IDS_KEY = "animation-constructor-last-edited";

/** Max IDs to store */
export const MAX_LAST_EDITED = 10;
