"""Deterministic QA audit scoring for adjudication outputs."""

from __future__ import annotations

from typing import Dict, Iterable, Mapping, Sequence

from core.models import PreAuthCaseInput


def compute_audit_metrics(
    clinical_input: PreAuthCaseInput,
    extracted_fields: Mapping[str, object],
    adjudication_result: Mapping[str, object],
    validation_context: Mapping[str, object],
) -> Dict[str, object]:
    recommendation = str(adjudication_result.get("recommendation") or "NEED_MORE_INFO")
    quality_score = _coerce_float(validation_context.get("quality_score"), fallback=0.5)

    criteria_results = _coerce_dict_list(adjudication_result.get("criteria_results"))
    supporting_evidence = _coerce_dict_list(adjudication_result.get("supporting_evidence"))
    missing_information = _coerce_string_list(adjudication_result.get("missing_information"))

    unmet_count = 0
    partial_count = 0
    for result in criteria_results:
        status = str(result.get("status") or "").upper()
        if status == "UNMET":
            unmet_count += 1
        elif status == "PARTIAL":
            partial_count += 1

    criteria_total = len(criteria_results)
    supporting_count = len(supporting_evidence)
    missing_count = len(missing_information)

    contradiction_signals = _count_contradiction_signals(
        clinical_input=clinical_input,
        extracted_fields=extracted_fields,
        criteria_results=criteria_results,
    )

    consistency_score = _compute_consistency_score(
        recommendation=recommendation,
        quality_score=quality_score,
        criteria_total=criteria_total,
        unmet_count=unmet_count,
        partial_count=partial_count,
        supporting_count=supporting_count,
    )

    contradiction_risk_index = _compute_contradiction_risk_index(
        contradiction_signals=contradiction_signals,
        partial_count=partial_count,
        supporting_count=supporting_count,
    )

    appeal_readiness_score = _compute_appeal_readiness_score(
        recommendation=recommendation,
        supporting_count=supporting_count,
        missing_count=missing_count,
        contradiction_risk_index=contradiction_risk_index,
    )

    audit_flags = _build_audit_flags(
        recommendation=recommendation,
        consistency_score=consistency_score,
        contradiction_risk_index=contradiction_risk_index,
        appeal_readiness_score=appeal_readiness_score,
        missing_count=missing_count,
        unmet_count=unmet_count,
    )

    return {
        "consistency_score": round(consistency_score, 2),
        "contradiction_risk_index": round(contradiction_risk_index, 2),
        "appeal_readiness_score": round(appeal_readiness_score, 2),
        "audit_flags": audit_flags,
    }


def _compute_consistency_score(
    recommendation: str,
    quality_score: float,
    criteria_total: int,
    unmet_count: int,
    partial_count: int,
    supporting_count: int,
) -> float:
    score = quality_score
    penalty = 0.0
    bonus = 0.0

    if criteria_total == 0:
        penalty += 0.25
    if supporting_count == 0:
        penalty += 0.10

    if recommendation == "LIKELY_APPROVE":
        if unmet_count > 0:
            penalty += 0.30
        if partial_count > 1:
            penalty += 0.15
        if unmet_count == 0 and partial_count == 0:
            bonus += 0.15
    elif recommendation == "LIKELY_DENY":
        if unmet_count == 0:
            penalty += 0.35
        if unmet_count >= 1:
            bonus += 0.10
    else:  # NEED_MORE_INFO
        if unmet_count > 1:
            penalty += 0.15
        if partial_count >= 1:
            bonus += 0.05

    return _clamp(score - penalty + bonus)


def _compute_contradiction_risk_index(
    contradiction_signals: int,
    partial_count: int,
    supporting_count: int,
) -> float:
    risk = 0.05
    risk += min(0.18 * contradiction_signals, 0.55)
    risk += min(0.08 * partial_count, 0.24)
    if supporting_count == 0:
        risk += 0.12
    return _clamp(risk)


def _compute_appeal_readiness_score(
    recommendation: str,
    supporting_count: int,
    missing_count: int,
    contradiction_risk_index: float,
) -> float:
    evidence_strength = min(supporting_count / 5.0, 1.0)
    actionable_missing = min(missing_count / 4.0, 1.0)

    if recommendation == "LIKELY_DENY":
        base = 0.45
    elif recommendation == "NEED_MORE_INFO":
        base = 0.50
    else:
        base = 0.25

    score = base + 0.30 * evidence_strength + 0.20 * actionable_missing
    score -= 0.15 * contradiction_risk_index
    return _clamp(score)


def _build_audit_flags(
    recommendation: str,
    consistency_score: float,
    contradiction_risk_index: float,
    appeal_readiness_score: float,
    missing_count: int,
    unmet_count: int,
) -> list[str]:
    flags: list[str] = []
    if consistency_score < 0.55:
        flags.append("Low consistency between recommendation and criterion outcomes.")
    if contradiction_risk_index >= 0.50:
        flags.append("High contradiction risk detected across evidence and criterion narratives.")
    if recommendation == "LIKELY_DENY" and unmet_count == 0:
        flags.append("Denial recommendation lacks explicit UNMET criteria support.")
    if missing_count >= 3:
        flags.append("High documentation gap burden identified.")
    if appeal_readiness_score >= 0.70:
        flags.append("Appeal packet is likely actionable with current evidence footprint.")
    return _dedupe(flags)


def _count_contradiction_signals(
    clinical_input: PreAuthCaseInput,
    extracted_fields: Mapping[str, object],
    criteria_results: Sequence[Mapping[str, object]],
) -> int:
    keywords = ("contradict", "inconsisten", "conflict", "mismatch", "versus")
    texts: list[str] = []
    texts.append(str(clinical_input.contradictory_flags or ""))
    texts.append(str(extracted_fields.get("contradictory_flags") or ""))
    for result in criteria_results:
        texts.append(str(result.get("supporting_evidence") or ""))
        texts.append(str(result.get("gap_or_risk") or ""))

    signals = 0
    for text in texts:
        lowered = text.lower()
        if any(keyword in lowered for keyword in keywords):
            signals += 1
    return signals


def _coerce_dict_list(value: object) -> list[Mapping[str, object]]:
    if not isinstance(value, list):
        return []
    items: list[Mapping[str, object]] = []
    for item in value:
        if isinstance(item, dict):
            items.append(item)
    return items


def _coerce_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]


def _coerce_float(value: object, fallback: float) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return fallback
    return fallback


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _dedupe(items: Iterable[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for item in items:
        key = item.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        output.append(item.strip())
    return output
