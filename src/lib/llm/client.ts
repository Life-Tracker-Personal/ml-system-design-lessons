import { loadSettings } from "./settings";
import { chat as openrouterChat, type ChatMessage } from "./openrouter";

const SYSTEM_PROMPT =
  "You are a concise, rigorous ML-interview tutor embedded in a lessons " +
  "website. Answer the user's question directly in GitHub-flavored markdown. " +
  "You have no tools and no file access — never attempt to use any tool, just answer.";

export interface AskResult {
  text: string;
  sessionId: string;
  model?: string;
  isError: boolean;
}

const sessions = new Map<string, ChatMessage[]>();

export async function ask(query: string, sessionId?: string): Promise<AskResult> {
  const settings = loadSettings();

  if (settings.mode === "local") {
    return askBridge(query, sessionId, settings.bridgePort);
  }

  return askOpenRouter(query, sessionId, settings);
}

async function askOpenRouter(
  query: string,
  sessionId: string | undefined,
  settings: ReturnType<typeof loadSettings>,
): Promise<AskResult> {
  if (!settings.openrouterKey) {
    return {
      text: "Connect your OpenRouter account in Settings to start chatting.",
      sessionId: sessionId ?? "",
      isError: true,
    };
  }

  const sid = sessionId ?? crypto.randomUUID();
  const history = sessions.get(sid) ?? [];

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: query },
  ];

  const result = await openrouterChat(settings.openrouterKey, settings.modelId, messages);

  history.push({ role: "user", content: query });
  history.push({ role: "assistant", content: result.text });
  sessions.set(sid, history);

  return {
    text: result.text,
    sessionId: sid,
    model: result.model,
    isError: false,
  };
}

async function askBridge(
  query: string,
  sessionId: string | undefined,
  port: number,
): Promise<AskResult> {
  const resp = await fetch(`http://127.0.0.1:${port}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId ?? null }),
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
