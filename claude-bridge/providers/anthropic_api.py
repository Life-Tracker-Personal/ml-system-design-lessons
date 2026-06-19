"""
Provider for the Anthropic Messages API directly (not via OpenRouter).
"""
from __future__ import annotations

import uuid

import httpx

from .base import LLMResponse, Provider

API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"


class AnthropicProvider(Provider):
    def __init__(
        self,
        api_key: str,
        model: str,
        timeout: float = 120,
        max_tokens: int = 4096,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self._client = httpx.AsyncClient(timeout=timeout)
        self._sessions: dict[str, list[dict]] = {}

    async def ask(
        self, query: str, session_id: str | None, system_prompt: str
    ) -> LLMResponse:
        sid = session_id or uuid.uuid4().hex
        history = self._sessions.get(sid, [])

        messages: list[dict] = list(history)
        messages.append({"role": "user", "content": query})

        resp = await self._client.post(
            API_URL,
            headers={
                "x-api-key": self.api_key,
                "anthropic-version": API_VERSION,
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "system": system_prompt,
                "messages": messages,
                "max_tokens": self.max_tokens,
            },
        )

        if resp.status_code != 200:
            try:
                detail = resp.json().get("error", {}).get("message", resp.text[:500])
            except Exception:
                detail = resp.text[:500]
            raise RuntimeError(f"Anthropic {resp.status_code}: {detail}")

        data = resp.json()
        text = "".join(b["text"] for b in data["content"] if b["type"] == "text")

        history.append({"role": "user", "content": query})
        history.append({"role": "assistant", "content": text})
        self._sessions[sid] = history

        return LLMResponse(
            text=text,
            session_id=sid,
            model=data.get("model", self.model),
        )

    def health_info(self) -> dict:
        return {"provider": "anthropic", "model": self.model}

    async def close(self) -> None:
        await self._client.aclose()
