# claude-bridge

A tiny **local** FastAPI service that answers the lessons website's LLM requests
by shelling out to your own Claude Code CLI (`claude -p`), with **no tools**.

```
browser ──POST http://127.0.0.1:8787/ask──▶ claude-bridge ──`claude -p`──▶ JSON
```

## Why this exists

For users with a Claude subscription, this lets you use your existing CLI
session as a free tutor backend. The website also supports OpenRouter directly
(via OAuth in the browser) — the bridge is only needed for local Claude CLI.

## Run

Requires **Python 3.10+**, [uv](https://docs.astral.sh/uv/), and the `claude` CLI installed & logged in.

```bash
cd claude-bridge
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
python main.py                  # serves on 127.0.0.1:8787
```

Then in the website, open Settings (gear icon) → switch to **Local Bridge**.

## API

`GET /health` → `{ "ok": true, "provider": "local-cli", "model": "sonnet" }`

`POST /ask`
```jsonc
// request
{ "query": "Explain why CE beats MSE for classification.",
  "session_id": null }          // omit/null for a new conversation
// response
{ "text": "...markdown answer...",
  "session_id": "32b4...e252",   // send back to continue the conversation
  "is_error": false,
  "model": "sonnet" }
```

## Security model

- **No tools:** `--allowedTools ""` — the model cannot run Bash/Edit/etc.
- **Localhost only:** binds `127.0.0.1`; never expose publicly.
- **No injection:** `create_subprocess_exec` (no shell); query on stdin.
- **Bounded:** query size cap + per-request timeout.
- Each `/ask` costs real Claude usage on *your* account.
