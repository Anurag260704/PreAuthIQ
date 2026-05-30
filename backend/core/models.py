"""Core model aliases for MedClear architecture."""

from skill.schema import (  # keep compatibility with existing tests/scripts
    AppealDraftResponse,
    CriterionResult,
    EvidenceSnippet,
    PreAuthCaseInput,
    PreAuthSkillOutput,
    SourcedField,
    ValidationInsights,
)

__all__ = [
    "CriterionResult",
    "EvidenceSnippet",
    "AppealDraftResponse",
    "PreAuthCaseInput",
    "PreAuthSkillOutput",
    "SourcedField",
    "ValidationInsights",
]
