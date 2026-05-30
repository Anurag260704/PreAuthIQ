"""Report assembly exceptions."""

from pydantic_core import ErrorDetails


class AssemblyError(Exception):
    """Raised when LLM output cannot be assembled into PreAuthSkillOutput."""

    def __init__(self, validation_error: list[ErrorDetails], raw_eval_snippet: str) -> None:
        self.validation_error = validation_error
        self.raw_eval_snippet = raw_eval_snippet
        super().__init__(f"Assembly validation failed: {validation_error}")
