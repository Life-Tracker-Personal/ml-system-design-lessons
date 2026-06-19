# claude-bridge

A tiny **local** FastAPI service that answers the lessons website's LLM requests
by routing them to any provider — OpenRouter (default), OpenAI, Anthropic,
Google, or your local Claude Code CLI.

```
browser ──POST http://127.0.0.1:8787/ask──▶ claude-bridge ──provider──▶ JSON
```

## Why this exists

A page served from Vercel cannot reach `127.0.0.1` on your machine — on a
serverless function "localhost" is the server, not your laptop. So routing LLM
calls through *your* keys requires a process running **on your machine**.

## Run

Requires **Python 3.10+**.

```bash
cd claude-bridge
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # configure provider + API key
export $(grep -v '^#' .env | xargs)
python main.py                  # serves on 127.0.0.1:8787
```

## Providers

Set `BRIDGE_PROVIDER` and `BRIDGE_API_KEY` in `.env`:

| Provider     | `BRIDGE_PROVIDER` | Default model                          | Needs          |
|-------------|-------------------|----------------------------------------|----------------|
| OpenRouter  | `openrouter`      | `anthropic/claude-sonnet-4-20250514`   | `BRIDGE_API_KEY` |
| OpenAI      | `openai`          | `gpt-4o`                               | `BRIDGE_API_KEY` |
| Anthropic   | `anthropic`       | `claude-sonnet-4-20250514`             | `BRIDGE_API_KEY` |
| Google      | `google`          | `gemini-2.5-flash`                     | `BRIDGE_API_KEY` |
| Local CLI   | `local`           | `sonnet`                               | `claude` binary |

**Custom endpoint:** set any provider name + `BRIDGE_BASE_URL` + `BRIDGE_API_KEY`
for any OpenAI-compatible service (Together AI, Groq, Azure, etc.).

Override the model with `BRIDGE_MODEL`.

## API

`GET /health` → `{ "ok": true, "provider": "...", "model": "..." }`

`POST /ask`
```jsonc
// request
{ "query": "Explain why CE beats MSE for classification.",
  "session_id": null }          // omit/null for a new conversation
// response
{ "text": "...markdown answer...",
  "session_id": "32b4...e252",   // send back to continue the conversation
  "is_error": false,
  "model": "anthropic/claude-sonnet-4-20250514" }
```

Send `Authorization: Bearer <BRIDGE_TOKEN>` if a token is configured.

## Calling from the website

```ts
async function askBridge(query: string, sessionId?: string) {
  const r = await fetch("http://127.0.0.1:8787/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_BRIDGE_TOKEN ?? ""}`,
    },
    body: JSON.stringify({ query, session_id: sessionId ?? null }),
  });
  if (!r.ok) throw new Error(`bridge ${r.status}`);
  return r.json() as Promise<{ text: string; session_id: string; is_error: boolean }>;
}
```

## Security model

- **Localhost only:** binds `127.0.0.1`; never expose publicly.
- **Token:** set `BRIDGE_TOKEN` so arbitrary pages can't drive your keys.
- **No shell injection:** local CLI provider uses `create_subprocess_exec` with
  query on stdin (never as argv or a shell string).
- **Bounded:** query size cap + per-request timeout.
- Sessions are in-memory — lost on restart.

## Next step: streaming (optional)

For token-by-token UX, add an SSE `/ask/stream` endpoint. The non-streaming
`/ask` above is the simplest correct starting point.
