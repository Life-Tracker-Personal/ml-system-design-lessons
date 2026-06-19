"""
Provider that shells out to the local Claude Code CLI (`claude -p`).
Requires `claude` installed and logged in on this machine.
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil

from .base import LLMResponse, Provider


class LocalCLIProvider(Provider):
    def __init__(
        self,
        claude_bin: str | None = None,
        model: str = "sonnet",
        timeout: float = 120,
    ) -> None:
        self.claude_bin = claude_bin or shutil.which("claude") or "claude"
        self.model = model
        self.timeout = timeout

    async def ask(
        self, query: str, session_id: str | None, system_prompt: str
    ) -> LLMResponse:
        args = [
            self.claude_bin,
            "-p",
            "--output-format", "json",
            "--allowedTools", "",
            "--model", self.model,
            "--append-system-prompt", system_prompt,
        ]
        if session_id:
            args += ["--resume", session_id]

        try:
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError:
            raise RuntimeError(f"claude binary not found at {self.claude_bin!r}")

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=query.encode()), timeout=self.timeout
            )
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise RuntimeError("claude process timed out")

        if proc.returncode != 0:
            raise RuntimeError(
                f"claude exited {proc.returncode}: "
                f"{stderr.decode(errors='replace')[:500]}"
            )

        try:
            data = json.loads(stdout.decode())
        except json.JSONDecodeError:
            raise RuntimeError("could not parse claude JSON output")

        return LLMResponse(
            text=data.get("result", ""),
            session_id=data.get("session_id", session_id or ""),
            is_error=bool(data.get("is_error", False)),
            model=self.model,
        )

    def health_info(self) -> dict:
        return {
            "provider": "local-cli",
            "claude_bin": self.claude_bin,
            "model": self.model,
        }
