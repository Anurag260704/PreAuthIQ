"""Coercion helpers for PreAuthSkillOutput assembly."""

from __future__ import annotations

from typing import Literal, Optional, cast

from core.models import CriterionResult, EvidenceSnippet, ValidationInsights
from core.report.types import RawCriterionResult, RawEvidenceSnippet


def coerce_str(value: object, default: str = "") -> str:
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or default
    return default


def coerce_optional_str(value: object) -> Optional[str]:
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None
    return None


def coerce_optional_score(value: object) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return round(max(0.0, min(1.0, float(value))), 2)
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        try:
            parsed = float(cleaned)
        except ValueError:
            return None
        return round(max(0.0, min(1.0, parsed)), 2)
    return None


def coerce_recommendation(
    value: object,
) -> Literal["LIKELY_APPROVE", "NEED_MORE_INFO", "LIKELY_DENY"]:
    if value in {"LIKELY_APPROVE", "NEED_MORE_INFO", "LIKELY_DENY"}:
        return cast(Literal["LIKELY_APPROVE", "NEED_MORE_INFO", "LIKELY_DENY"], value)
    return "NEED_MORE_INFO"


def coerce_confidence(value: object) -> Literal["HIGH", "MEDIUM", "LOW"]:
    if value in {"HIGH", "MEDIUM", "LOW"}:
        return cast(Literal["HIGH", "MEDIUM", "LOW"], value)
    return "LOW"


def coerce_status(value: object) -> Literal["MET", "PARTIAL", "UNMET", "N/A"]:
    if value in {"MET", "PARTIAL", "UNMET", "N/A"}:
        return cast(Literal["MET", "PARTIAL", "UNMET", "N/A"], value)
    return "N/A"


def coerce_validation_insights(value: object) -> Optional[ValidationInsights]:
    if not isinstance(value, dict):
        return None
    try:
        return ValidationInsights.model_validate(value)
    except Exception:
        return None


def normalize_criterion_result(result: RawCriterionResult) -> CriterionResult:
    return CriterionResult(
        criterion_id=coerce_str(result.get("criterion_id"), default="Unknown Criterion"),
        criterion_name=coerce_str(result.get("criterion_name"), default="Unknown Criterion"),
        status=coerce_status(result.get("status")),
        supporting_evidence=coerce_optional_str(result.get("supporting_evidence")),
        gap_or_risk=coerce_optional_str(result.get("gap_or_risk")),
    )


def normalize_evidence_snippet(item: RawEvidenceSnippet) -> EvidenceSnippet:
    return EvidenceSnippet(
        source=coerce_str(item.get("source"), default="Unknown source"),
        excerpt=coerce_str(item.get("excerpt"), default=""),
    )
