"""Step 2: deterministic input validation and enrichment."""

from typing import Dict, List, TypedDict

from core.exceptions import PreflightValidationError
from core.models import PreAuthCaseInput
from skill.constants import MAX_RAW_CLINICAL_NOTES_LENGTH


class ValidationContext(TypedDict):
    quality_score: float
    required_field_issues: List[str]
    enrichment_hints: List[str]


def preflight_validate(clinical_input: PreAuthCaseInput) -> None:
    """Fail fast on invalid input before any LLM call."""
    issues: List[str] = []

    for field_name in ("requested_service", "primary_diagnosis"):
        value = getattr(clinical_input, field_name, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            issues.append(f"Missing required field: {field_name}")

    raw_notes = clinical_input.raw_clinical_notes
    if raw_notes is not None and len(raw_notes) > MAX_RAW_CLINICAL_NOTES_LENGTH:
        issues.append(
            "raw_clinical_notes exceeds maximum length "
            f"({MAX_RAW_CLINICAL_NOTES_LENGTH} characters)."
        )

    if issues:
        raise PreflightValidationError("preflight", "; ".join(issues))


def validate_and_enrich_input(
    clinical_input: PreAuthCaseInput,
    extracted_fields: Dict[str, object],
) -> ValidationContext:
    required_field_issues: List[str] = []
    enrichment_hints: List[str] = []
    expected_required = ["requested_service", "primary_diagnosis"]

    for field_name in expected_required:
        value = getattr(clinical_input, field_name, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            required_field_issues.append(f"Missing required field: {field_name}")

    if not extracted_fields.get("functional_impairment_adls"):
        enrichment_hints.append("Add explicit ADL limitations to strengthen functional necessity.")
    if not extracted_fields.get("objective_neurologic_deficits"):
        enrichment_hints.append("Include objective exam findings to reduce adjudication ambiguity.")
    if not extracted_fields.get("supporting_evidence"):
        enrichment_hints.append("Attach source-cited evidence snippets from recent specialist notes.")

    penalty = min(0.2 * len(required_field_issues) + 0.05 * len(enrichment_hints), 0.9)
    quality_score = max(0.1, 1.0 - penalty)

    return {
        "quality_score": round(quality_score, 2),
        "required_field_issues": required_field_issues,
        "enrichment_hints": enrichment_hints,
    }
