"""Final report composition."""

from typing import Dict, Mapping

from core.models import PreAuthCaseInput, PreAuthSkillOutput
from core.report import AssemblyError, assemble_report

from core.exceptions import CompositionError


def compose_report(
    adjudication_result: Dict[str, object],
    clinical_input: PreAuthCaseInput,
    step1_ms: int,
    step3_ms: int,
    total_ms: int,
    validation_context: Mapping[str, object],
) -> PreAuthSkillOutput:
    report_payload = dict(adjudication_result)
    report_payload["validation_insights"] = validation_context
    try:
        return assemble_report(report_payload, clinical_input, step1_ms, step3_ms, total_ms)
    except AssemblyError as exc:
        raise CompositionError(str(exc)) from exc
