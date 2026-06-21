import { defaultModelId } from "./models";

export interface LLMSettings {
  mode: "openrouter" | "local";
  modelId: string;
  bridgePort: number;
  openrouterKey: string | null;
}

const STORAGE_KEY = "llm-settings";

const defaults: LLMSettings = {
  mode: "openrouter",
  modelId: defaultModelId,
  bridgePort: 8787,
  openrouterKey: null,
};

export function loadSettings(): LLMSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s: LLMSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function patchSettings(patch: Partial<LLMSettings>): LLMSettings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}
