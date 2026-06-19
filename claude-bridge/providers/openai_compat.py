"""
Provider for any OpenAI-compatible chat completions API.
Covers OpenRouter, OpenAI, Google Gemini (OpenAI-compat endpoint),
Together AI, Groq, and any other service that speaks the same protocol.
"""
from __future__ import annotations

import uuid

import httpx

from .base import LLMResponse, Provider


class OpenAICompatProvider(Provider):
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        timeout: float = 120,
        max_tokens: int = 4096,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.max_tokens = max_tokens
        self._client = httpx.AsyncClient(timeout=timeout)
        self._sessions: dict[str, list[dict]] = {}

    async def ask(
        self, query: str, session_id: str | None, system_prompt: str
    ) -> LLMResponse:
        sid = session_id or uuid.uuid4().hex
        history = self._sessions.get(sid, [])

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": query})

        resp = await self._client.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
            },
        )

        if resp.status_code != 200:
            try:
                detail = resp.json().get("error", {}).get("message", resp.text[:500])
            except Exception:
                detail = resp.text[:500]
            raise RuntimeError(f"{resp.status_code} from {self.base_url}: {detail}")

        data = resp.json()
        text = data["choices"][0]["message"]["content"]

        history.append({"role": "user", "content": query})
        history.append({"role": "assistant", "content": text})
        self._sessions[sid] = history

        return LLMResponse(
            text=text,
            session_id=sid,
            model=data.get("model", self.model),
        )

    def health_info(self) -> dict:
        return {
            "provider": "openai-compatible",
            "base_url": self.base_url,
            "model": self.model,
        }

    async def close(self) -> None:
        await self._client.aclose()
