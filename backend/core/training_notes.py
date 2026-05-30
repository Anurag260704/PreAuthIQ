"""Build structured clinical notes from training case metadata."""

from typing import Mapping


def build_expanded_clinical_notes(case: Mapping[str, object]) -> str:
    """Expand a training case row into structured notes for the LLM pipeline."""
    case_id = str(case.get("case_id") or "unknown")
    requested_service = str(case.get("requested_service") or "Not specified")
    clinical_scenario = str(case.get("clinical_scenario") or "")
    supporting = str(case.get("key_supporting_evidence") or "")
    gaps = str(case.get("key_gaps_or_risks") or "")
    why = str(case.get("why") or "")
    flip_doc = str(case.get("if_additional_documentation_arrives") or "N/A")
    complexity = str(case.get("complexity_notes") or "")

    sections = [
        "=== STRUCTURED CLINICAL PACKET (TRAINING CASE) ===",
        f"Case ID: {case_id}",
        f"Requested Service: {requested_service}",
        "",
        "Clinical Scenario:",
        clinical_scenario,
        "",
        "Supporting Evidence Documented in Chart:",
        supporting,
        "",
        "Documentation Gaps / Clinical Risks:",
        gaps,
        "",
        "Clinical Rationale Summary:",
        why,
        "",
        "If Additional Documentation Arrives:",
        flip_doc,
    ]
    if complexity:
        sections.extend(["", "Reviewer Complexity Notes:", complexity])

    prebuilt = case.get("expanded_clinical_notes")
    if isinstance(prebuilt, str) and prebuilt.strip():
        return prebuilt.strip()

    return "\n".join(sections).strip()
