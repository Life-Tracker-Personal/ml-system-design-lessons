# claude-bridge security notes

The bridge runs the user's own `claude` CLI (`claude -p`) on their machine and
answers HTTP requests from the lessons website. Anything that can reach it can
spend the user's Claude usage — and, if tools were reachable, take actions on
their machine. This documents the threat model, the audit findings, and what is
enforced.

## Threat model

- **Untrusted callers.** Any web page the user visits can attempt requests to
  `http://127.0.0.1:8787`. The bridge must only serve the lessons site.
- **Untrusted content.** `/ask` payloads (question + injected lesson text) are
  untrusted and may contain prompt-injection attempting to invoke tools.
- **Inherited config.** The CLI reads the user's settings, whose
  `permissions.allow` can include shell commands (this user's project settings
  allow e.g. `Bash(curl *)`, `Bash(git:*)`) — a data-exfiltration path if a
  tool ever runs.

## Findings and status

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | High | `--allowedTools ""` is an *allow*-list, not an off switch; the CLI still inherits the user's `permissions.allow`, so a prompt-injected query could in principle run an allowed shell tool (`curl` → exfiltration). | **Fixed** — explicit `--disallowedTools` (deny beats allow in Claude Code) + `--strict-mcp-config` (no MCP tools load) + isolated working dir so project settings aren't on the search path. |
| 2 | Medium | Cross-origin browser calls could drive the local CLI. | **Fixed** — CORS allowlist (pre-existing) **plus** a server-side `Origin` check returning 403 for any disallowed origin. |
| 2b | Medium | DNS-rebinding: a public hostname re-resolved to 127.0.0.1 bypasses CORS. | **Fixed** — `TrustedHostMiddleware` restricts the `Host` header to `127.0.0.1`/`localhost` (pre-existing in v0.3.1). |
| 3 | Medium | `/ask` open by default (no auth) beyond the localhost bind. | **Mitigated** — optional `BRIDGE_TOKEN` bearer gate (pre-existing) + a startup notice when it is unset; localhost bind + Origin allowlist remain the baseline. |
| 4 | Low | Shell injection / unbounded work. | **Not vulnerable** — `create_subprocess_exec` (no shell), query on stdin, size cap, per-request timeout, 127.0.0.1 bind (all pre-existing). |

## What guarantees "no tools"

Three independent layers, so no single misconfiguration re-opens tool use:

1. `--allowedTools ""` — nothing pre-approved.
2. `--disallowedTools Bash Edit MultiEdit Write NotebookEdit Read Glob Grep WebFetch WebSearch Task TodoWrite` — deny rules take precedence over any inherited allow.
3. `--strict-mcp-config` with no `--mcp-config` — no MCP servers (and their tools) load, whatever the user has configured.

Plus the process runs in a throwaway `tempfile.mkdtemp()` directory, so the
current project's `.claude/settings.local.json` allowlist is never even loaded.

## Residual risk / recommendations

- **User-level settings still load.** Layer 2 (deny) neutralizes any allow they
  contain, but for maximum isolation run the bridge under a dedicated
  `CLAUDE_CONFIG_DIR` pointed at a clean directory.
- **Token off by default.** Set `BRIDGE_TOKEN` (and keep `BRIDGE_ALLOWED_ORIGINS`
  tight) so a rogue local process can't call `/ask` either.
- **Never bind beyond localhost.** A startup warning fires if `BRIDGE_HOST` is
  non-loopback; do not expose the bridge publicly.

## Verification

`python3 -m py_compile main.py` passes. With a stub `claude` binary: `/health`
→ 200; `/ask` with a disallowed `Origin` → 403; with an allowed origin → 200;
with no `Origin` (curl) → 200. The tool-gate flags are asserted present in the
CLI invocation.
