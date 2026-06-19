"""
claude-bridge — a local LLM bridge that routes requests to any provider
(OpenRouter, OpenAI, Anthropic, Google, local Claude CLI, or any
OpenAI-compatible endpoint).

Run on your machine — do NOT deploy to the cloud.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from providers import create_provider
from providers.base import Provider

BRIDGE_TOKEN = os.environ.get("BRIDGE_TOKEN", "")
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

_provider: Provider | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _provider
    _provider = create_provider()
    yield
    await _provider.close()


app = FastAPI(title="claude-bridge", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
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
    assert _provider is not None
    return {"ok": True, **_provider.health_info()}


@app.post("/ask", response_model=AskResponse)
async def ask(
    req: AskRequest, authorization: str | None = Header(default=None)
) -> AskResponse:
    _check_auth(authorization)
    if len(req.query) > MAX_QUERY_CHARS:
        raise HTTPException(status_code=413, detail="query too long")

    assert _provider is not None
    try:
        result = await _provider.ask(req.query, req.session_id, SYSTEM_PROMPT)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)[:500])

    return AskResponse(
        text=result.text,
        session_id=result.session_id,
        is_error=result.is_error,
        model=result.model,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("BRIDGE_HOST", "127.0.0.1"),
        port=int(os.environ.get("BRIDGE_PORT", "8787")),
    )
