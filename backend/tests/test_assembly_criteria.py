"""Golden tests for assembly and criteria routing."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from core.models import PreAuthCaseInput
from core.policy.catalog import resolve_policy_key, resolve_policy_rules
from core.report import assemble_report

FIXTURE_PATH = (
    Path(__file__).resolve().parents[2] / "outputs" / "complex_case_output.json"
)

METADATA_FIELDS = frozenset(
    {
        "processing_time_ms",
        "step1_time_ms",
        "step2_time_ms",
        "model_used",
        "validation_insights",
        "consistency_score",
        "contradiction_risk_index",
        "appeal_readiness_score",
        "audit_flags",
    }
)

EXPECTED_POLICY_ROUTING: list[tuple[str, str, int]] = [
    ("C5-C6 cervical decompression/fusion (inpatient)", "spine_surgery", 6),
    ("Elective lumbar fusion for chronic low-back pain", "spine_surgery", 6),
    ("Total knee arthroplasty", "default", 3),
    ("Home oxygen (nocturnal only)", "dme_home_oxygen", 4),
    ("Biologic therapy for ulcerative colitis", "biologic_therapy", 4),
    ("PET/CT surveillance after thyroid cancer", "high_cost_imaging", 4),
    ("IVIG for CIDP", "biologic_therapy", 4),
    ("Inpatient rehabilitation after ischemic stroke", "post_acute_rehab", 4),
    ("Bariatric surgery", "bariatric_surgery", 4),
    ("TAVR", "cardiovascular_procedure", 4),
]


def test_assembler_complex_case_golden() -> None:
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    payload = {k: v for k, v in fixture.items() if k not in METADATA_FIELDS}
    clinical_input = PreAuthCaseInput(
        case_id=fixture["case_id"],
        requested_service=fixture["requested_service"],
        primary_diagnosis="Cervical spondylotic myelopathy",
        site_of_care="inpatient",
    )
    output = assemble_report(payload, clinical_input, step1_ms=100, step2_ms=200, total_ms=300)
    assert output.recommendation == fixture["recommendation"]
    assert output.criteria_met == fixture["criteria_met"]
    assert output.criteria_partial_or_unmet == fixture["criteria_partial_or_unmet"]
    assert len(output.criteria_results) == len(fixture["criteria_results"])


@pytest.mark.parametrize(
    ("requested_service", "expected_key", "expected_count"),
    EXPECTED_POLICY_ROUTING,
)
def test_criteria_routing_training_services(
    requested_service: str,
    expected_key: str,
    expected_count: int,
) -> None:
    assert resolve_policy_key(requested_service) == expected_key
    assert len(resolve_policy_rules(requested_service)) == expected_count


def test_promotion_knee_arthroplasty() -> None:
    raw_eval = {
        "recommendation": "NEED_MORE_INFO",
        "confidence": "MEDIUM",
        "clinical_summary": "Severe knee OA.",
        "criteria_results": [{"criterion_id": "C1", "criterion_name": "X", "status": "MET"}],
        "criteria_met": ["C1"],
        "criteria_partial_or_unmet": [],
        "supporting_evidence": [],
        "missing_information": [],
        "provider_query": "Need more info",
    }
    case_input = PreAuthCaseInput(
        requested_service="Total knee arthroplasty",
        primary_diagnosis="OA",
        raw_clinical_notes=(
            "Severe tricompartmental OA. Failed NSAIDs, injection, PT. "
            "Cane use and inability to climb stairs."
        ),
    )
    output = assemble_report(raw_eval, case_input, 1, 2, 3)
    assert output.recommendation == "LIKELY_APPROVE"
    assert output.confidence == "HIGH"


def test_promotion_ivig() -> None:
    raw_eval = {
        "recommendation": "NEED_MORE_INFO",
        "confidence": "MEDIUM",
        "clinical_summary": "CIDP",
        "criteria_results": [],
        "criteria_met": [],
        "criteria_partial_or_unmet": [],
        "supporting_evidence": [],
        "missing_information": [],
        "provider_query": "",
    }
    case_input = PreAuthCaseInput(
        requested_service="IVIG for CIDP",
        primary_diagnosis="CIDP",
        raw_clinical_notes=(
            "Progressive weakness, areflexia, EMG supportive, steroid intolerance documented."
        ),
    )
    output = assemble_report(raw_eval, case_input, 1, 2, 3)
    assert output.recommendation == "LIKELY_APPROVE"


def test_promotion_rehab() -> None:
    raw_eval = {
        "recommendation": "NEED_MORE_INFO",
        "confidence": "LOW",
        "clinical_summary": "Stroke rehab",
        "criteria_results": [],
        "criteria_met": [],
        "criteria_partial_or_unmet": [],
        "supporting_evidence": [],
        "missing_information": [],
        "provider_query": "",
    }
    case_input = PreAuthCaseInput(
        requested_service="Inpatient rehabilitation after stroke",
        primary_diagnosis="Stroke",
        raw_clinical_notes="Needs 3 hrs/day, two disciplines, unsafe for home.",
    )
    output = assemble_report(raw_eval, case_input, 1, 2, 3)
    assert output.recommendation == "LIKELY_APPROVE"


def test_promotion_tavr() -> None:
    raw_eval = {
        "recommendation": "NEED_MORE_INFO",
        "confidence": "MEDIUM",
        "clinical_summary": "AS",
        "criteria_results": [],
        "criteria_met": [],
        "criteria_partial_or_unmet": [],
        "supporting_evidence": [],
        "missing_information": [],
        "provider_query": "",
    }
    case_input = PreAuthCaseInput(
        requested_service="TAVR",
        primary_diagnosis="Aortic stenosis",
        raw_clinical_notes="Severe AS with syncope, dyspnea, heart team and frailty assessment.",
    )
    output = assemble_report(raw_eval, case_input, 1, 2, 3)
    assert output.recommendation == "LIKELY_APPROVE"
