"""Tests for training case note expansion."""

from core.training_notes import build_expanded_clinical_notes


def test_build_expanded_clinical_notes_includes_key_sections():
    case = {
        "case_id": "PA-002",
        "requested_service": "Elective lumbar fusion",
        "clinical_scenario": "Mechanical back pain",
        "key_supporting_evidence": "Chronic pain >1 year",
        "key_gaps_or_risks": "No instability documented",
        "why": "Does not meet fusion criteria",
        "if_additional_documentation_arrives": "Only flips with instability",
        "complexity_notes": "False-positive risk",
    }
    notes = build_expanded_clinical_notes(case)
    assert "PA-002" in notes
    assert "Mechanical back pain" in notes
    assert "Chronic pain >1 year" in notes
    assert "No instability documented" in notes
    assert "False-positive risk" in notes


def test_build_expanded_clinical_notes_prefers_prebuilt_field():
    case = {
        "case_id": "PA-003",
        "expanded_clinical_notes": "Prebuilt packet content",
        "clinical_scenario": "ignored",
    }
    assert build_expanded_clinical_notes(case) == "Prebuilt packet content"
