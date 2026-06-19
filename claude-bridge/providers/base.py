from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMResponse:
    text: str
    session_id: str
    is_error: bool = False
    model: str | None = None


class Provider(ABC):
    @abstractmethod
    async def ask(
        self, query: str, session_id: str | None, system_prompt: str
    ) -> LLMResponse: ...

    @abstractmethod
    def health_info(self) -> dict: ...

    async def close(self) -> None:
        pass
