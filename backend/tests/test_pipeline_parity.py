"""Golden parity tests for pipeline refactor — output must remain unchanged."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import pytest

from core.composer import compose_report
from core.engine import AuthorizationEngine
from core.exceptions import PreflightValidationError
from core.models import PreAuthCaseInput, PreAuthSkillOutput
from core.validator import preflight_validate
from skill.constants import MAX_RAW_CLINICAL_NOTES_LENGTH
from tests.stub_provider import StubProvider

METADATA_FIELDS = frozenset(
    {
        "processing_time_ms",
        "step1_time_ms",
        "step2_time_ms",
        "model_used",
    }
)

FIXTURE_PATH = (
    Path(__file__).resolve().parents[2] / "outputs" / "complex_case_output.json"
)


def _business_output(output: PreAuthSkillOutput) -> dict[str, Any]:
    data = output.model_dump()
    for field in METADATA_FIELDS:
        data.pop(field, None)
    return data


def _stub_case_input() -> PreAuthCaseInput:
    return PreAuthCaseInput(
        case_id="PA-EXT",
        requested_service="Cervical fusion",
        primary_diagnosis="Cervical myelopathy",
    )


def test_stub_provider_golden_snapshot() -> None:
    """Full engine output (excluding timing metadata) must match baseline."""
    engine = AuthorizationEngine(provider=StubProvider())
    output = asyncio.run(engine.process_case(_stub_case_input()))
    business = _business_output(output)

    assert business["case_id"] == "PA-EXT"
    assert business["requested_service"] == "Cervical fusion"
    assert business["recommendation"] == "NEED_MORE_INFO"
    assert business["confidence"] == "MEDIUM"
    assert business["criteria_met"] == []
    assert business["criteria_partial_or_unmet"] == []
    assert business["missing_information"] == ["Provide inpatient rationale"]
    assert business["provider_query"] == "Please submit inpatient monitoring rationale."
    assert business["validation_insights"] is not None
    assert 0.0 <= business["validation_insights"]["quality_score"] <= 1.0
    assert business["consistency_score"] is not None
    assert business["contradiction_risk_index"] is not None
    assert business["appeal_readiness_score"] is not None


def test_policy_before_extraction_same_verdict() -> None:
    """Policy resolution before extraction must not change stub-provider verdict."""
    provider = StubProvider()
    engine = AuthorizationEngine(provider=provider)
    output = asyncio.run(engine.process_case(_stub_case_input()))

    assert provider.calls == 2
    assert output.recommendation == "NEED_MORE_INFO"
    assert output.criteria_met == []
    assert output.criteria_partial_or_unmet == []


def test_assembler_fixture_golden_parity() -> None:
    """compose_report on fixture adjudication JSON preserves key business fields."""
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    expected_recommendation = fixture["recommendation"]
    expected_criteria_met = fixture["criteria_met"]
    expected_partial = fixture["criteria_partial_or_unmet"]
    expected_criteria_results = fixture["criteria_results"]

    adjudication_payload = {
        key: value
        for key, value in fixture.items()
        if key not in METADATA_FIELDS
    }

    clinical_input = PreAuthCaseInput(
        case_id=fixture["case_id"],
        requested_service=fixture["requested_service"],
        primary_diagnosis="Cervical spondylotic myelopathy",
        site_of_care="inpatient",
    )
    validation_context = {
        "quality_score": 0.85,
        "required_field_issues": [],
        "enrichment_hints": [],
    }

    output = compose_report(
        adjudication_result=adjudication_payload,
        clinical_input=clinical_input,
        step1_ms=100,
        step3_ms=200,
        total_ms=300,
        validation_context=validation_context,
    )

    assert output.recommendation == expected_recommendation
    assert output.criteria_met == expected_criteria_met
    assert output.criteria_partial_or_unmet == expected_partial
    assert len(output.criteria_results) == len(expected_criteria_results)
    for actual, expected in zip(output.criteria_results, expected_criteria_results):
        assert actual.criterion_id == expected["criterion_id"]
        assert actual.status == expected["status"]


def test_preflight_rejects_blank_required_fields() -> None:
    with pytest.raises(PreflightValidationError):
        preflight_validate(
            PreAuthCaseInput(requested_service=" ", primary_diagnosis=" ")
        )


def test_preflight_rejects_oversized_notes() -> None:
    oversized = "x" * (MAX_RAW_CLINICAL_NOTES_LENGTH + 1)
    clinical_input = PreAuthCaseInput.model_construct(
        requested_service="MRI",
        primary_diagnosis="Back pain",
        raw_clinical_notes=oversized,
    )
    with pytest.raises(PreflightValidationError):
        preflight_validate(clinical_input)


def test_preflight_skips_llm_on_invalid_input() -> None:
    provider = StubProvider()
    engine = AuthorizationEngine(provider=provider)
    with pytest.raises(PreflightValidationError):
        asyncio.run(
            engine.process_case(
                PreAuthCaseInput(requested_service=" ", primary_diagnosis=" ")
            )
        )
    assert provider.calls == 0
