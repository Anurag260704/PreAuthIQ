"""Generate deterministic appeal packet drafts."""

from __future__ import annotations

from typing import Iterable

from core.models import AppealDraftResponse, PreAuthSkillOutput


def generate_appeal_draft(report: PreAuthSkillOutput) -> AppealDraftResponse:
    criterion_rebuttals = _build_criterion_rebuttals(report)
    missing_checklist = _build_missing_checklist(report)
    reconsideration_text = _build_reconsideration_text(report, criterion_rebuttals)

    return AppealDraftResponse(
        case_id=report.case_id,
        recommendation=report.recommendation,
        summary_of_medical_necessity=_build_medical_necessity_summary(report),
        criterion_rebuttals=criterion_rebuttals,
        missing_evidence_checklist=missing_checklist,
        requested_reconsideration_text=reconsideration_text,
    )


def _build_medical_necessity_summary(report: PreAuthSkillOutput) -> str:
    confidence_text = report.confidence.lower()
    return (
        f"Case {report.case_id} requests {report.requested_service}. "
        f"Current adjudication is {report.recommendation.replace('_', ' ').title()} "
        f"with {confidence_text} confidence. "
        "This appeal draft consolidates criterion-level evidence and documentation actions "
        "to support reconsideration."
    )


def _build_criterion_rebuttals(report: PreAuthSkillOutput) -> list[str]:
    rebuttals: list[str] = []
    for result in report.criteria_results:
        if result.status not in {"PARTIAL", "UNMET"}:
            continue
        evidence = result.supporting_evidence or "No explicit supporting evidence captured yet."
        gap = result.gap_or_risk or "No specific gap described."
        rebuttals.append(
            f"{result.criterion_id} ({result.criterion_name}): status={result.status}. "
            f"Evidence: {evidence} Action: address gap -> {gap}"
        )

    if rebuttals:
        return rebuttals

    return [
        "No PARTIAL/UNMET criteria were identified. Appeal can emphasize complete criterion fulfillment and source-cited evidence."
    ]


def _build_missing_checklist(report: PreAuthSkillOutput) -> list[str]:
    if report.missing_information:
        return _dedupe(report.missing_information)

    checklist: list[str] = []
    for result in report.criteria_results:
        if result.status in {"PARTIAL", "UNMET"} and result.gap_or_risk:
            checklist.append(result.gap_or_risk)
    if checklist:
        return _dedupe(checklist)
    return ["No additional documentation checklist items were generated from this report."]


def _build_reconsideration_text(
    report: PreAuthSkillOutput,
    criterion_rebuttals: list[str],
) -> str:
    if report.recommendation == "LIKELY_APPROVE":
        return (
            "Request confirmation of approval and document closure, as all criteria appear satisfied with available evidence."
        )

    rebuttal_count = len(
        [line for line in criterion_rebuttals if not line.lower().startswith("no partial/unmet")]
    )
    return (
        f"We request reconsideration for case {report.case_id}. "
        f"The attached packet addresses {rebuttal_count} criterion-level concerns, "
        "clarifies documentation gaps, and aligns evidence to policy expectations."
    )


def _dedupe(items: Iterable[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for item in items:
        cleaned = " ".join(item.split()).strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(cleaned)
    return output
