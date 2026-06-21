import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";

  const html = `<!DOCTYPE html>
<html><head><title>Connecting…</title></head>
<body><script>
  window.opener
    ? window.opener.postMessage({ type: "openrouter-code", code: ${JSON.stringify(code)} }, window.location.origin)
    : localStorage.setItem("or-pending-code", ${JSON.stringify(code)});
  window.close();
</script>
<p>Connected! You can close this tab.</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
