export type AIModelType = {
  modelId: string;
  text: string;
  icon?: string;
  popularity?: number;
};

export const rawData: AIModelType[] = [
  {
    modelId: "deepseek/deepseek-chat-v3-0324:free",
    text: "DeepSeek: DeepSeek V3 0324 (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "deepseek/deepseek-r1-0528:free",
    text: "DeepSeek: R1 0528 (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-coder:free",
    text: "Qwen: Qwen3 Coder  (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "deepseek/deepseek-r1:free",
    text: "DeepSeek: R1 (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "z-ai/glm-4.5-air:free",
    text: "Z.AI: GLM 4.5 Air (free)",
    popularity: 0,
  },
  {
    modelId: "tngtech/deepseek-r1t2-chimera:free",
    text: "TNG: DeepSeek R1T2 Chimera (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "moonshotai/kimi-k2:free",
    text: "MoonshotAI: Kimi K2 (free)",
    popularity: 0,
  },
  {
    modelId: "tngtech/deepseek-r1t-chimera:free",
    text: "TNG: DeepSeek R1T Chimera (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-235b-a22b:free",
    text: "Qwen: Qwen3 235B A22B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "google/gemini-2.0-flash-exp:free",
    text: "Google: Gemini 2.0 Flash Experimental (free)",
    popularity: 0,
  },
  {
    modelId: "meta-llama/llama-3.3-70b-instruct:free",
    text: "Meta: Llama 3.3 70B Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "microsoft/mai-ds-r1:free",
    text: "Microsoft: MAI DS R1 (free)",
    popularity: 0,
  },
  {
    modelId: "openai/gpt-oss-20b:free",
    text: "OpenAI: gpt-oss-20b (free)",
    icon: "/models logotypes/chatgpt-white.svg",
    popularity: 5,
  },
  {
    modelId: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    text: "DeepSeek: Deepseek R1 0528 Qwen3 8B (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-14b:free",
    text: "Qwen: Qwen3 14B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "mistralai/mistral-small-3.2-24b-instruct:free",
    text: "Mistral: Mistral Small 3.2 24B (free)",
    popularity: 0,
  },
  {
    modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    text: "Venice: Uncensored (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen2.5-vl-72b-instruct:free",
    text: "Qwen: Qwen2.5 VL 72B Instruct (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "google/gemma-3-27b-it:free",
    text: "Google: Gemma 3 27B (free)",
    popularity: 0,
  },
  {
    modelId: "mistralai/mistral-nemo:free",
    text: "Mistral: Mistral Nemo (free)",
    popularity: 0,
  },
  {
    modelId: "mistralai/mistral-small-3.1-24b-instruct:free",
    text: "Mistral: Mistral Small 3.1 24B (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen-2.5-coder-32b-instruct:free",
    text: "Qwen2.5 Coder 32B Instruct (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "deepseek/deepseek-r1-distill-llama-70b:free",
    text: "DeepSeek: R1 Distill Llama 70B (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
  {
    modelId: "agentica-org/deepcoder-14b-preview:free",
    text: "Agentica: Deepcoder 14B Preview (free)",
    popularity: 0,
  },
  {
    modelId: "moonshotai/kimi-dev-72b:free",
    text: "MoonshotAI: Kimi Dev 72B (free)",
    popularity: 0,
  },
  {
    modelId: "mistralai/mistral-7b-instruct:free",
    text: "Mistral: Mistral 7B Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-30b-a3b:free",
    text: "Qwen: Qwen3 30B A3B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen-2.5-72b-instruct:free",
    text: "Qwen2.5 72B Instruct (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "meta-llama/llama-3.1-405b-instruct:free",
    text: "Meta: Llama 3.1 405B Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "featherless/qwerky-72b:free",
    text: "Qrwkv 72B (free)",
    popularity: 0,
  },
  {
    modelId: "moonshotai/kimi-vl-a3b-thinking:free",
    text: "MoonshotAI: Kimi VL A3B Thinking (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-8b:free",
    text: "Qwen: Qwen3 8B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "cognitivecomputations/dolphin3.0-mistral-24b:free",
    text: "Dolphin3.0 Mistral 24B (free)",
    popularity: 0,
  },
  {
    modelId: "nousresearch/deephermes-3-llama-3-8b-preview:free",
    text: "Nous: DeepHermes 3 Llama 3 8B Preview (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwq-32b:free",
    text: "Qwen: QwQ 32B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "mistralai/devstral-small-2505:free",
    text: "Mistral: Devstral Small 2505 (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen2.5-vl-32b-instruct:free",
    text: "Qwen: Qwen2.5 VL 32B Instruct (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "meta-llama/llama-3.2-11b-vision-instruct:free",
    text: "Meta: Llama 3.2 11B Vision Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "google/gemma-3n-e2b-it:free",
    text: "Google: Gemma 3n 2B (free)",
    popularity: 0,
  },
  {
    modelId: "qwen/qwen3-4b:free",
    text: "Qwen: Qwen3 4B (free)",
    icon: "/models logotypes/qwen.webp",
    popularity: 0,
  },
  {
    modelId: "shisa-ai/shisa-v2-llama3.3-70b:free",
    text: "Shisa AI: Shisa V2 Llama 3.3 70B  (free)",
    popularity: 0,
  },
  {
    modelId: "tencent/hunyuan-a13b-instruct:free",
    text: "Tencent: Hunyuan A13B Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "google/gemma-3-12b-it:free",
    text: "Google: Gemma 3 12B (free)",
    popularity: 0,
  },
  {
    modelId: "arliai/qwq-32b-arliai-rpr-v1:free",
    text: "ArliAI: QwQ 32B RpR v1 (free)",
    popularity: 0,
  },
  {
    modelId: "google/gemma-2-9b-it:free",
    text: "Google: Gemma 2 9B (free)",
    popularity: 0,
  },
  {
    modelId: "mistralai/mistral-small-24b-instruct-2501:free",
    text: "Mistral: Mistral Small 3 (free)",
    popularity: 0,
  },
  {
    modelId: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
    text: "Dolphin3.0 R1 Mistral 24B (free)",
    popularity: 0,
  },
  {
    modelId: "meta-llama/llama-3.2-3b-instruct:free",
    text: "Meta: Llama 3.2 3B Instruct (free)",
    popularity: 0,
  },
  {
    modelId: "google/gemma-3n-e4b-it:free",
    text: "Google: Gemma 3n 4B (free)",
    popularity: 0,
  },
  {
    modelId: "google/gemma-3-4b-it:free",
    text: "Google: Gemma 3 4B (free)",
    popularity: 0,
  },
  {
    modelId: "sarvamai/sarvam-m:free",
    text: "Sarvam AI: Sarvam-M (free)",
    popularity: 0,
  },
  {
    modelId: "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    text: "NVIDIA: Llama 3.1 Nemotron Ultra 253B v1 (free)",
    popularity: 0,
  },
  {
    modelId: "rekaai/reka-flash-3:free",
    text: "Reka: Flash 3 (free)",
    popularity: 0,
  },
  {
    modelId: "deepseek/deepseek-r1-distill-qwen-14b:free",
    text: "DeepSeek: R1 Distill Qwen 14B (free)",
    icon: "/models logotypes/deepseek-white.svg",
    popularity: 0,
  },
];
