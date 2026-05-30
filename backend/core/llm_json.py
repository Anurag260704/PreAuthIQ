"""Shared LLM JSON parsing with optional completion retry."""

from __future__ import annotations

import json
from typing import Dict, cast

from core.providers import LLMProvider


class LLMJSONParseError(ValueError):
    """Raised when LLM output cannot be parsed as JSON after retries."""

    def __init__(self, step: str, raw: str) -> None:
        self.step = step
        self.raw = raw
        super().__init__(f"Invalid JSON from {step}")


def parse_llm_json(raw: str, *, step: str) -> Dict[str, object]:
    try:
        return cast(Dict[str, object], json.loads(raw))
    except json.JSONDecodeError as exc:
        raise LLMJSONParseError(step, raw) from exc


async def complete_and_parse_json(
    provider: LLMProvider,
    system_prompt: str,
    user_message: str,
    *,
    step: str,
    max_parse_retries: int = 1,
) -> Dict[str, object]:
    """Call the provider and parse JSON, retrying the same prompt on parse failure."""
    last_raw = ""
    attempts = max_parse_retries + 1
    last_error: LLMJSONParseError | None = None

    for _ in range(attempts):
        last_raw = await provider.complete(system_prompt, user_message)
        try:
            return parse_llm_json(last_raw, step=step)
        except LLMJSONParseError as exc:
            last_error = exc

    assert last_error is not None
    raise LLMJSONParseError(last_error.step, last_raw)
