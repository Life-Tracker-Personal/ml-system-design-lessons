"""
claude-bridge — a local service that routes LLM requests to the user's
own Claude Code CLI (`claude -p`), with NO tools.

Run on your machine — do NOT deploy to the cloud.
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

CLAUDE_BIN = os.environ.get("CLAUDE_BIN") or shutil.which("claude") or "claude"
MODEL = os.environ.get("BRIDGE_MODEL", "sonnet")
BRIDGE_TOKEN = os.environ.get("BRIDGE_TOKEN", "")
TIMEOUT_S = float(os.environ.get("BRIDGE_TIMEOUT_S", "120"))
MAX_QUERY_CHARS = int(os.environ.get("BRIDGE_MAX_QUERY_CHARS", "8000"))
SYSTEM_PROMPT = os.environ.get(
    "BRIDGE_SYSTEM_PROMPT",
    "You are a concise, rigorous ML-interview tutor embedded in a lessons "
    "website. Answer the user's question directly in GitHub-flavored markdown. "
    "You have no tools and no file access — never attempt to use any tool, just answer.",
)
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "BRIDGE_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]

app = FastAPI(title="claude-bridge", version="0.3.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
# CORS alone doesn't stop DNS rebinding — a browser tricked into re-resolving
# some public hostname to 127.0.0.1 will send the request without any CORS
# check. Reject anything whose Host header isn't localhost.
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["127.0.0.1", "localhost"],
)


class AskRequest(BaseModel):
    query: str = Field(..., min_length=1)
    session_id: str | None = Field(None)


class AskResponse(BaseModel):
    text: str
    session_id: str
    is_error: bool = False
    model: str | None = None


def _check_auth(authorization: str | None) -> None:
    if not BRIDGE_TOKEN:
        return
    if authorization != f"Bearer {BRIDGE_TOKEN}":
        raise HTTPException(status_code=401, detail="invalid or missing token")


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "provider": "local-cli", "claude_bin": CLAUDE_BIN, "model": MODEL}


@app.post("/ask", response_model=AskResponse)
async def ask(
    req: AskRequest, authorization: str | None = Header(default=None)
) -> AskResponse:
    _check_auth(authorization)
    if len(req.query) > MAX_QUERY_CHARS:
        raise HTTPException(status_code=413, detail="query too long")

    args = [
        CLAUDE_BIN, "-p",
        "--output-format", "json",
        "--allowedTools", "",
        "--model", MODEL,
        "--append-system-prompt", SYSTEM_PROMPT,
    ]
    if req.session_id:
        args += ["--resume", req.session_id]

    try:
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"claude binary not found at {CLAUDE_BIN!r}")

    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=req.query.encode()), timeout=TIMEOUT_S
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        raise HTTPException(status_code=504, detail="claude timed out")

    if proc.returncode != 0:
        raise HTTPException(
            status_code=502,
            detail=f"claude exited {proc.returncode}: {stderr.decode(errors='replace')[:500]}",
        )

    try:
        data = json.loads(stdout.decode())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="could not parse claude JSON output")

    return AskResponse(
        text=data.get("result", ""),
        session_id=data.get("session_id", req.session_id or ""),
        is_error=bool(data.get("is_error", False)),
        model=MODEL,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("BRIDGE_HOST", "127.0.0.1"),
        port=int(os.environ.get("BRIDGE_PORT", "8787")),
    )
