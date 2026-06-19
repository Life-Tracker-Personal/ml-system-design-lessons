from __future__ import annotations

import os

from .anthropic_api import AnthropicProvider
from .base import Provider
from .local_cli import LocalCLIProvider
from .openai_compat import OpenAICompatProvider

PRESETS: dict[str, dict] = {
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "anthropic/claude-sonnet-4-20250514",
        "type": "openai_compat",
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
        "type": "openai_compat",
    },
    "google": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "default_model": "gemini-2.5-flash",
        "type": "openai_compat",
    },
    "anthropic": {
        "default_model": "claude-sonnet-4-20250514",
        "type": "anthropic",
    },
    "local": {
        "default_model": "sonnet",
        "type": "local",
    },
}


def create_provider() -> Provider:
    name = os.environ.get("BRIDGE_PROVIDER", "openrouter").lower()
    api_key = os.environ.get("BRIDGE_API_KEY", "")
    model = os.environ.get("BRIDGE_MODEL", "")
    base_url = os.environ.get("BRIDGE_BASE_URL", "")
    timeout = float(os.environ.get("BRIDGE_TIMEOUT_S", "120"))
    max_tokens = int(os.environ.get("BRIDGE_MAX_TOKENS", "4096"))

    preset = PRESETS.get(name, {})
    ptype = preset.get("type", "openai_compat")
    model = model or preset.get("default_model", "")
    base_url = base_url or preset.get("base_url", "")

    if ptype == "local" or name == "local":
        return LocalCLIProvider(
            claude_bin=os.environ.get("CLAUDE_BIN"),
            model=model or "sonnet",
            timeout=timeout,
        )

    if ptype == "anthropic":
        return AnthropicProvider(
            api_key=api_key, model=model, timeout=timeout, max_tokens=max_tokens
        )

    return OpenAICompatProvider(
        api_key=api_key,
        base_url=base_url,
        model=model,
        timeout=timeout,
        max_tokens=max_tokens,
    )
