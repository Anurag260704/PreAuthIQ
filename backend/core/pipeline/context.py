"""Pipeline execution context."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional

from core.models import PreAuthCaseInput
from core.policy_catalog import Criterion
from core.providers import LLMProvider
from core.validator import ValidationContext


@dataclass
class PipelineContext:
    clinical_input: PreAuthCaseInput
    provider: LLMProvider
    policy_rules: list[Criterion] = field(default_factory=list)
    extracted_fields: Dict[str, object] = field(default_factory=dict)
    validation_context: Optional[ValidationContext] = None
    adjudication_result: Dict[str, object] = field(default_factory=dict)
    step_timings_ms: Dict[str, int] = field(default_factory=dict)
    start_monotonic: float = 0.0
