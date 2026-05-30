"""Individual pipeline step wrappers."""

from __future__ import annotations

import time

from core.adjudicator import adjudicate_policy
from core.auditor import compute_audit_metrics
from core.composer import compose_report
from core.extractor import extract_clinical_fields
from core.models import PreAuthSkillOutput
from core.pipeline.context import PipelineContext
from core.policy_catalog import resolve_policy_rules
from core.validator import preflight_validate, validate_and_enrich_input


def run_preflight(context: PipelineContext) -> None:
    preflight_validate(context.clinical_input)


def run_resolve_policy(context: PipelineContext) -> None:
    context.policy_rules = resolve_policy_rules(context.clinical_input.requested_service)


async def run_extract(context: PipelineContext) -> None:
    started = time.monotonic()
    context.extracted_fields = await extract_clinical_fields(
        context.clinical_input,
        context.provider,
    )
    context.step_timings_ms["extract"] = int((time.monotonic() - started) * 1000)


def run_validate(context: PipelineContext) -> None:
    context.validation_context = validate_and_enrich_input(
        context.clinical_input,
        context.extracted_fields,
    )


async def run_adjudicate(context: PipelineContext) -> None:
    assert context.validation_context is not None
    started = time.monotonic()
    context.adjudication_result = await adjudicate_policy(
        extracted_fields=context.extracted_fields,
        policy_rules=context.policy_rules,
        clinical_input=context.clinical_input,
        provider=context.provider,
    )
    model_used = context.provider.get_last_model_used()
    if model_used:
        context.adjudication_result["model_used"] = model_used
    context.step_timings_ms["adjudicate"] = int((time.monotonic() - started) * 1000)


def run_audit(context: PipelineContext) -> None:
    assert context.validation_context is not None
    audit_metrics = compute_audit_metrics(
        clinical_input=context.clinical_input,
        extracted_fields=context.extracted_fields,
        adjudication_result=context.adjudication_result,
        validation_context=context.validation_context,
    )
    context.adjudication_result.update(audit_metrics)


def run_compose(context: PipelineContext) -> PreAuthSkillOutput:
    assert context.validation_context is not None
    total_ms = int((time.monotonic() - context.start_monotonic) * 1000)
    extract_ms = context.step_timings_ms.get("extract", 0)
    adjudicate_ms = context.step_timings_ms.get("adjudicate", 0)
    return compose_report(
        adjudication_result=context.adjudication_result,
        clinical_input=context.clinical_input,
        step1_ms=extract_ms,
        step3_ms=adjudicate_ms,
        total_ms=total_ms,
        validation_context=context.validation_context,
    )
