import { parseUsage, type Usage } from "./usage";

const AUTH_URL = "https://openrouter.ai/auth";
const KEYS_URL = "https://openrouter.ai/api/v1/auth/keys";
const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function generateVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Base64url(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const VERIFIER_KEY = "or-pkce-verifier";

export async function startOAuthFlow(): Promise<void> {
  const verifier = generateVerifier();
  // localStorage (not sessionStorage): the OAuth round-trip navigates the tab
  // away to openrouter.ai and back via the callback redirect. sessionStorage
  // can be dropped across that cross-origin hop; localStorage survives it (and
  // is readable by the /settings page that performs the exchange). Single-use
  // and cleared immediately after exchangeCode().
  localStorage.setItem(VERIFIER_KEY, verifier);

  const challenge = await sha256Base64url(verifier);
  const callbackUrl = `${window.location.origin}/api/openrouter/callback`;

  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${AUTH_URL}?${params}`;
}

export async function exchangeCode(code: string): Promise<string> {
  const verifier = localStorage.getItem(VERIFIER_KEY) ?? "";
  localStorage.removeItem(VERIFIER_KEY);
  if (!verifier) {
    throw new Error(
      "Missing PKCE verifier — the sign-in link was opened in a different " +
        "browser or the verifier expired. Please click Connect again.",
    );
  }

  const resp = await fetch(KEYS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      code_challenge_method: "S256",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter key exchange failed: ${text}`);
  }

  const data = await resp.json();
  return data.key as string;
}

export class OpenRouterError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  text: string;
  model: string;
  usage?: Usage;
}

export async function chat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    // usage.include asks OpenRouter to report real token counts AND the
    // dollar cost of the generation in the response body.
    body: JSON.stringify({ model, messages, usage: { include: true } }),
  });

  if (!resp.ok) {
    let detail = await resp.text();
    try {
      detail = JSON.parse(detail).error?.message ?? detail;
    } catch {
      // not JSON — keep the raw body
    }
    throw new OpenRouterError(resp.status, detail);
  }

  const data = await resp.json();
  // OpenRouter can also report failures in a 200 body.
  if (data.error) {
    throw new OpenRouterError(
      data.error.code ?? 500,
      data.error.message ?? "Unknown OpenRouter error",
    );
  }
  return {
    text: data.choices[0].message.content,
    model: data.model ?? model,
    usage: parseUsage(data.usage),
  };
}
