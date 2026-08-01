# LLM key storage — security notes

## Where the OpenRouter key lives

The OpenRouter API key obtained via the OAuth PKCE flow is stored in the
browser's `localStorage` (key `llm-settings`) on the user's device. It is
**never transmitted to our servers** — the browser talks to OpenRouter
directly with `Authorization: Bearer <key>`.

## Is that secure?

**Partially. Be honest with users about the tradeoff:**

- ✅ The key never touches our backend, so a server breach can't leak it.
- ✅ It stays on one device; "Disconnect & delete key" removes it.
- ❌ `localStorage` is **not encrypted at rest** and is readable by **any
  JavaScript running on this origin**. A cross-site-scripting (XSS) bug, or a
  malicious dependency, could exfiltrate it. This is the standard risk of any
  browser-held API key.

Mitigations in place:

- The OAuth **PKCE** flow means the key is minted per-connection and the
  authorization code is single-use with a verifier that never leaves the device.
- The auth **callback** sets a strict CSP and validates the `code` shape.
- Users can delete the key at any time and are told (on `/settings`) exactly
  where it lives.

## Recommended hardening (follow-up, not in this PR)

Move the key server-side so page scripts can never read it:

1. Exchange the OAuth code in a **server route**; store the key in an
   **httpOnly, Secure, SameSite=Strict cookie** (invisible to JS).
2. Add a **server-side proxy** route (`/api/tutor`) that attaches the key to
   the OpenRouter request. The browser calls our proxy; the key stays on the
   server.
3. Bonus: enforce a per-session spend cap and rate limit at the proxy.

This removes the XSS-exfiltration risk entirely at the cost of routing tutor
traffic through our backend. Tracked as a follow-up because it also intersects
the spend-tracking work (the proxy is the natural place to record usage).
