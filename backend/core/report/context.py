"""Assembly execution context."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import MutableMapping

from core.models import PreAuthCaseInput


@dataclass
class AssemblyContext:
    payload: MutableMapping[str, object]
    case_input: PreAuthCaseInput
    step1_ms: int
    step2_ms: int
    total_ms: int
    recommendation: str = field(default="NEED_MORE_INFO")

    @classmethod
    def from_inputs(
        cls,
        payload: MutableMapping[str, object],
        case_input: PreAuthCaseInput,
        step1_ms: int,
        step2_ms: int,
        total_ms: int,
    ) -> "AssemblyContext":
        recommendation = str(payload.get("recommendation") or "NEED_MORE_INFO")
        return cls(
            payload=payload,
            case_input=case_input,
            step1_ms=step1_ms,
            step2_ms=step2_ms,
            total_ms=total_ms,
            recommendation=recommendation,
        )
