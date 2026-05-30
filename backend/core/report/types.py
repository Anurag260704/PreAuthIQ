"""Shared payload types for report assembly."""

from typing import TypedDict


class RawCriterionResult(TypedDict, total=False):
    criterion_id: object
    criterion_name: object
    status: object
    supporting_evidence: object
    gap_or_risk: object
    gap_risk: object


class RawEvidenceSnippet(TypedDict):
    source: object
    excerpt: object
