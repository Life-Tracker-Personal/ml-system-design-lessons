import { NextRequest, NextResponse } from "next/server";

// OpenRouter authorization codes are opaque tokens with URL-safe characters.
// Reject anything else so a malformed `?code=` never reaches the HTML below.
const CODE_RE = /^[A-Za-z0-9_.\-~]{1,512}$/;

// JSON.stringify escapes quotes and backslashes but NOT `<`, `>`, or the
// substring `</script>` — the HTML tokenizer would terminate the script tag
// at the first literal match and let attacker-controlled bytes execute as
// HTML. U+2028/U+2029 are literal line terminators in ES5+ and can also
// break out of a string, so escape them too. The regex is built via
// `new RegExp` because U+2028/U+2029 are not permitted inside a regex
// literal (they are LineTerminator per the spec).
const UNSAFE_IN_SCRIPT = new RegExp("[<>\\u2028\\u2029]", "g");
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  " ": "\\u2028",
  " ": "\\u2029",
};

function jsonForScript(value: string): string {
  return JSON.stringify(value).replace(UNSAFE_IN_SCRIPT, (c) => ESCAPES[c]);
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("code") ?? "";
  const code = CODE_RE.test(raw) ? raw : "";
  const encoded = jsonForScript(code);

  const html = `<!DOCTYPE html>
<html><head><title>Connecting…</title></head>
<body><script>
  var code = ${encoded};
  if (window.opener) {
    window.opener.postMessage({ type: "openrouter-code", code: code }, window.location.origin);
  } else {
    localStorage.setItem("or-pending-code", code);
  }
  window.close();
</script>
<p>Connected! You can close this tab.</p>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
