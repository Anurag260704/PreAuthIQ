"""Stage-based report builder."""

from __future__ import annotations

import copy
import logging
from typing import MutableMapping

from pydantic import ValidationError

from core.models import PreAuthCaseInput, PreAuthSkillOutput
from skill.constants import DEFAULT_MISTRAL_MODEL

from core.report.context import AssemblyContext
from core.report.coercion import (
    coerce_confidence,
    coerce_optional_score,
    coerce_optional_str,
    coerce_recommendation,
    coerce_str,
    coerce_validation_insights,
    normalize_criterion_result,
    normalize_evidence_snippet,
)
from core.report.errors import AssemblyError
from core.report.payload_utils import (
    dedupe_strings,
    get_criteria_results,
    get_string_list,
    get_supporting_evidence,
)
from core.report.promotion_engine import apply_promotion_rules
from core.report.stages.case_enrichment import (
    run_case_context_stage,
    run_post_adjudication_enrichment_stage,
)
from core.report.stages.criteria_sync import run_criteria_sync_stage
from core.report.stages.sanitize import run_sanitize_stage

logger = logging.getLogger(__name__)


def _apply_recommendation_constraints(context: AssemblyContext) -> None:
    payload = context.payload
    if context.recommendation != "LIKELY_DENY":
        payload["appeal_direction"] = None
    if context.recommendation == "LIKELY_APPROVE":
        payload["flip_condition"] = None
        payload["provider_query"] = ""


def assemble_report(
    raw_eval: MutableMapping[str, object],
    case_input: PreAuthCaseInput,
    step1_ms: int,
    step2_ms: int,
    total_ms: int,
) -> PreAuthSkillOutput:
    payload = copy.deepcopy(raw_eval)
    context = AssemblyContext.from_inputs(payload, case_input, step1_ms, step2_ms, total_ms)
    _apply_recommendation_constraints(context)

    run_sanitize_stage(context)
    run_case_context_stage(context)
    apply_promotion_rules(context.payload, context.case_input)
    run_criteria_sync_stage(context)
    run_post_adjudication_enrichment_stage(context)

    normalized_criteria_results = [
        normalize_criterion_result(result) for result in get_criteria_results(context.payload)
    ]
    normalized_supporting_evidence = [
        normalize_evidence_snippet(item)
        for item in get_supporting_evidence(context.payload)
    ]

    context.payload["case_id"] = case_input.case_id or "unknown"
    context.payload["requested_service"] = case_input.requested_service
    context.payload["processing_time_ms"] = total_ms
    context.payload["step1_time_ms"] = step1_ms
    context.payload["step2_time_ms"] = step2_ms
    if not context.payload.get("model_used"):
        context.payload["model_used"] = DEFAULT_MISTRAL_MODEL

    try:
        return PreAuthSkillOutput(
            case_id=coerce_str(context.payload.get("case_id"), default="unknown"),
            requested_service=coerce_str(
                context.payload.get("requested_service"),
                default=case_input.requested_service,
            ),
            recommendation=coerce_recommendation(context.payload.get("recommendation")),
            confidence=coerce_confidence(context.payload.get("confidence")),
            clinical_summary=coerce_str(context.payload.get("clinical_summary")),
            criteria_results=normalized_criteria_results,
            criteria_met=get_string_list(context.payload, "criteria_met"),
            criteria_partial_or_unmet=get_string_list(
                context.payload, "criteria_partial_or_unmet"
            ),
            supporting_evidence=normalized_supporting_evidence,
            missing_information=get_string_list(context.payload, "missing_information"),
            provider_query=coerce_str(context.payload.get("provider_query")),
            appeal_direction=coerce_optional_str(context.payload.get("appeal_direction")),
            flip_condition=coerce_optional_str(context.payload.get("flip_condition")),
            validation_insights=coerce_validation_insights(
                context.payload.get("validation_insights")
            ),
            consistency_score=coerce_optional_score(context.payload.get("consistency_score")),
            contradiction_risk_index=coerce_optional_score(
                context.payload.get("contradiction_risk_index")
            ),
            appeal_readiness_score=coerce_optional_score(
                context.payload.get("appeal_readiness_score")
            ),
            audit_flags=dedupe_strings(get_string_list(context.payload, "audit_flags")),
            processing_time_ms=total_ms,
            step1_time_ms=step1_ms,
            step2_time_ms=step2_ms,
            model_used=coerce_str(
                context.payload.get("model_used"),
                default=DEFAULT_MISTRAL_MODEL,
            ),
        )
    except ValidationError as exc:
        logger.error(
            "Assembly validation failed.\nRaw eval snippet: %s\nError: %s",
            str(context.payload)[:800],
            str(exc),
        )
        raise AssemblyError(
            validation_error=exc.errors(),
            raw_eval_snippet=str(context.payload)[:800],
        ) from exc
