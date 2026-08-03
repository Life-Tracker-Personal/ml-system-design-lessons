import { loadSettings } from "./settings";
import { chat as openrouterChat, type ChatMessage } from "./openrouter";
import type { Usage } from "./usage";
import {
  detectLessonRef,
  fetchBookContext,
  buildContextBlock,
} from "./context";

const SYSTEM_PROMPT =
  "You are a concise, rigorous ML-interview tutor embedded in a lessons " +
  "website. Answer the user's question directly in GitHub-flavored markdown. " +
  "You have no tools and no file access — never attempt to use any tool, just answer.";

export interface AskResult {
  text: string;
  sessionId: string;
  model?: string;
  isError: boolean;
  /** Token counts + cost for this response (OpenRouter mode only). */
  usage?: Usage;
}

/* ------------------------------------------------------------------ */
/* Conversation history — persisted so it survives a reload            */
/* ------------------------------------------------------------------ */

const HISTORY_KEY = "llm-history";
/** Keep the last N messages (user+assistant) per session. */
const MAX_HISTORY_MESSAGES = 40;

type HistoryStore = Record<string, ChatMessage[]>;

function readStore(): HistoryStore {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: HistoryStore): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded — history is best-effort */
  }
}

export function loadHistory(sessionId: string): ChatMessage[] {
  return readStore()[sessionId] ?? [];
}

function saveHistory(sessionId: string, messages: ChatMessage[]): void {
  const store = readStore();
  store[sessionId] = messages.slice(-MAX_HISTORY_MESSAGES);
  writeStore(store);
}

export function clearHistory(sessionId?: string): void {
  if (!sessionId) {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  const store = readStore();
  delete store[sessionId];
  writeStore(store);
}

/* ------------------------------------------------------------------ */
/* Book grounding                                                      */
/* ------------------------------------------------------------------ */

/** Lesson text for the page the reader is on, as a context block (or ""). */
async function currentContextBlock(): Promise<string> {
  if (typeof window === "undefined") return "";
  const ref = detectLessonRef(window.location.pathname);
  if (!ref) return "";
  const ctx = await fetchBookContext(ref);
  return ctx ? buildContextBlock(ctx) : "";
}

/* ------------------------------------------------------------------ */

export async function ask(query: string, sessionId?: string): Promise<AskResult> {
  const settings = loadSettings();
  const context = await currentContextBlock();

  if (settings.mode === "local") {
    return askBridge(query, sessionId, settings.bridgePort, context);
  }

  return askOpenRouter(query, sessionId, settings, context);
}

async function askOpenRouter(
  query: string,
  sessionId: string | undefined,
  settings: ReturnType<typeof loadSettings>,
  context: string,
): Promise<AskResult> {
  if (!settings.openrouterKey) {
    return {
      text: "Connect your OpenRouter account in Settings to start chatting.",
      sessionId: sessionId ?? "",
      isError: true,
    };
  }

  const sid = sessionId ?? crypto.randomUUID();
  const history = loadHistory(sid);

  // Rebuilt per request (the reader may navigate to another lesson mid-chat)
  // and deliberately never stored in history.
  const system = context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: query },
  ];

  const result = await openrouterChat(
    settings.openrouterKey,
    settings.modelId,
    messages,
  );

  saveHistory(sid, [
    ...history,
    { role: "user", content: query },
    { role: "assistant", content: result.text },
  ]);

  return {
    text: result.text,
    sessionId: sid,
    model: result.model,
    isError: false,
    usage: result.usage,
  };
}

async function askBridge(
  query: string,
  sessionId: string | undefined,
  port: number,
  context: string,
): Promise<AskResult> {
  // The CLI keeps its own conversation state via session_id, so the grounding
  // context only needs prepending on the first turn of a session.
  const payload =
    context && !sessionId ? `${context}\n\n---\n\n${query}` : query;

  const resp = await fetch(`http://127.0.0.1:${port}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: payload, session_id: sessionId ?? null }),
  });

  if (!resp.ok) {
    throw new Error(`Bridge returned ${resp.status}`);
  }

  const data = await resp.json();
  return {
    text: data.text,
    sessionId: data.session_id,
    model: data.model,
    isError: data.is_error,
  };
}
