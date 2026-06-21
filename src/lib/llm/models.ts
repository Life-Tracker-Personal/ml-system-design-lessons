export interface Model {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "google" | "meta" | "nvidia" | "openrouter";
  tier: "free" | "paid";
  description: string;
}

export const models: Model[] = [
  // ── Anthropic ──
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    provider: "anthropic",
    tier: "paid",
    description: "Most capable, deep reasoning",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    tier: "paid",
    description: "Fast and capable, great balance",
  },
  {
    id: "anthropic/claude-haiku-4",
    name: "Claude Haiku 4",
    provider: "anthropic",
    tier: "paid",
    description: "Fastest Anthropic model",
  },

  // ── OpenAI ──
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    tier: "paid",
    description: "Multimodal flagship",
  },
  {
    id: "openai/o3",
    name: "o3",
    provider: "openai",
    tier: "paid",
    description: "Advanced reasoning",
  },
  {
    id: "openai/o4-mini",
    name: "o4-mini",
    provider: "openai",
    tier: "paid",
    description: "Fast reasoning, low cost",
  },

  // ── Google ──
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    tier: "paid",
    description: "Google's most capable model",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    tier: "paid",
    description: "Fast and efficient",
  },

  // ── Open-source (free on OpenRouter) ──
  {
    id: "openrouter/free",
    name: "Free Auto-Router",
    provider: "openrouter",
    tier: "free",
    description: "Auto-picks the best free model",
  },
  {
    id: "nvidia/nemotron-3-ultra",
    name: "Nemotron 3 Ultra",
    provider: "nvidia",
    tier: "free",
    description: "550B MoE, 55B active params",
  },
  {
    id: "meta/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "meta",
    tier: "free",
    description: "Meta's latest open model",
  },
];

export const defaultModelId = "anthropic/claude-sonnet-4";

export function getModel(id: string): Model | undefined {
  return models.find((m) => m.id === id);
}
