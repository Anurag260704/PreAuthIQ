"""Engine-layer exception types."""

from typing import Optional


class EngineError(RuntimeError):
    """Top-level engine error."""


class EngineStepError(EngineError):
    """Raised when a specific pipeline step fails with structured context."""

    def __init__(
        self,
        step: str,
        message: str,
        raw_llm_snippet: Optional[str] = None,
    ) -> None:
        self.step = step
        self.message = message
        self.raw_llm_snippet = raw_llm_snippet
        super().__init__(message)


class ExtractionError(EngineStepError):
    """Clinical extraction failed."""


class AdjudicationError(EngineStepError):
    """Policy adjudication failed."""


class PreflightValidationError(EngineStepError):
    """Input failed deterministic preflight checks before LLM calls."""


class CompositionError(EngineError):
    """Final report composition failed."""


class LLMClientError(EngineError):
    """Provider client interaction failed."""
