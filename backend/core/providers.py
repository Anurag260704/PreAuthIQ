"""LLM provider abstraction for MedClear — Mistral backend."""

import logging
import os
from abc import ABC, abstractmethod
from typing import Optional

from mistralai import Mistral

from core.exceptions import LLMClientError
from skill.constants import (
    DEFAULT_MISTRAL_MODEL,
    MISTRAL_MAX_OUTPUT_TOKENS,
    MISTRAL_MODEL_CANDIDATES,
)
from skill.retry_utils import call_with_retry

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system_prompt: str, user_message: str) -> str:
        raise NotImplementedError

    def get_last_model_used(self) -> Optional[str]:
        return None


class MistralProvider(LLMProvider):
    """Mistral provider using the mistralai SDK."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        resolved_key = api_key or os.environ.get("MISTRAL_API_KEY")
        if not resolved_key:
            raise LLMClientError(
                "MISTRAL_API_KEY is not set. "
                "Create a key at https://console.mistral.ai/api-keys"
            )

        if model is not None and model.strip():
            self.models = [model.strip()]
        else:
            self.models = MISTRAL_MODEL_CANDIDATES or [DEFAULT_MISTRAL_MODEL]

        self.max_output_tokens = MISTRAL_MAX_OUTPUT_TOKENS
        self._last_model_used: Optional[str] = self.models[0] if self.models else None
        self.client = Mistral(api_key=resolved_key)
        logger.info("MistralProvider initialized with model candidates: %s", self.models)

    def get_last_model_used(self) -> Optional[str]:
        return self._last_model_used

    async def complete(self, system_prompt: str, user_message: str) -> str:
        errors: list[str] = []

        for candidate_model in self.models:
            try:
                response = await call_with_retry(
                    self.client.chat.complete_async,
                    max_retries=3,
                    model=candidate_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    temperature=0.0,
                    max_tokens=self.max_output_tokens,
                    response_format={"type": "json_object"},
                )
            except Exception as exc:
                errors.append(f"{candidate_model}: {exc}")
                logger.warning(
                    "Mistral model %s failed. Trying next candidate if available.",
                    candidate_model,
                )
                continue

            if not response.choices or not response.choices[0].message:
                errors.append(f"{candidate_model}: empty response")
                continue

            content = response.choices[0].message.content  # type: ignore[union-attr,unknown-member,unknown-variable]
            if not isinstance(content, str) or not content.strip():
                errors.append(f"{candidate_model}: invalid response payload")
                continue

            self._last_model_used = candidate_model
            return content

        error_text = "; ".join(errors) if errors else "No model candidate configured."
        raise LLMClientError(
            f"Mistral completion failed across all model candidates: {error_text}"
        )
