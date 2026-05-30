from __future__ import annotations

from fastapi.testclient import TestClient

import main
from core.auditor import compute_audit_metrics
from core.models import PreAuthCaseInput


def test_auditor_scores_are_bounded_and_flaggable() -> None:
    case_input = PreAuthCaseInput(
        case_id="PA-AUDIT",
        requested_service="Lumbar fusion",
        primary_diagnosis="Lumbar degenerative disc disease",
        contradictory_flags="PCP note says improved function; specialist note states worsening weakness.",
    )
    extracted = {"contradictory_flags": "Inconsistent motor findings across provider notes."}
    adjudication = {
        "recommendation": "NEED_MORE_INFO",
        "criteria_results": [
            {
                "criterion_id": "C2",
                "criterion_name": "Objective deficit",
                "status": "PARTIAL",
                "supporting_evidence": "Neurology note reports mild deficit.",
                "gap_or_risk": "Orthopedic note does not confirm deficit severity.",
            }
        ],
        "supporting_evidence": [{"source": "Neurology note", "excerpt": "Mild foot drop"}],
        "missing_information": ["Submit repeat focused neurologic exam documentation."],
    }
    validation = {"quality_score": 0.72}

    metrics = compute_audit_metrics(case_input, extracted, adjudication, validation)

    assert 0.0 <= float(metrics["consistency_score"]) <= 1.0
    assert 0.0 <= float(metrics["contradiction_risk_index"]) <= 1.0
    assert 0.0 <= float(metrics["appeal_readiness_score"]) <= 1.0
    assert isinstance(metrics["audit_flags"], list)
    assert any("contradiction" in flag.lower() for flag in metrics["audit_flags"])


def test_review_appeal_endpoint_returns_structured_packet() -> None:
    client = TestClient(main.app)

    payload = {
        "case_id": "PA-APPEAL",
        "requested_service": "Left shoulder arthroscopy",
        "recommendation": "LIKELY_DENY",
        "confidence": "HIGH",
        "clinical_summary": "Persistent shoulder pain with incomplete documentation for failed conservative care.",
        "criteria_results": [
            {
                "criterion_id": "C3",
                "criterion_name": "Conservative treatment failure",
                "status": "UNMET",
                "supporting_evidence": "Only one PT note uploaded.",
                "gap_or_risk": "Missing full treatment timeline and response details.",
            }
        ],
        "criteria_met": [],
        "criteria_partial_or_unmet": ["C3"],
        "supporting_evidence": [{"source": "PT note", "excerpt": "6 sessions completed"}],
        "missing_information": ["Provide full conservative treatment history and outcomes."],
        "provider_query": "Please submit complete conservative care records.",
        "appeal_direction": "Appeal with complete failed conservative therapy documentation.",
        "flip_condition": "Would reconsider with complete PT and injection response history.",
        "validation_insights": {
            "quality_score": 0.61,
            "required_field_issues": [],
            "enrichment_hints": [],
        },
        "consistency_score": 0.58,
        "contradiction_risk_index": 0.42,
        "appeal_readiness_score": 0.74,
        "audit_flags": ["High documentation gap burden identified."],
        "processing_time_ms": 1120,
        "step1_time_ms": 340,
        "step2_time_ms": 580,
        "model_used": "mistral-large-latest",
    }

    response = client.post("/api/v1/review/appeal", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["case_id"] == "PA-APPEAL"
    assert "summary_of_medical_necessity" in body
    assert isinstance(body["criterion_rebuttals"], list)
    assert isinstance(body["missing_evidence_checklist"], list)
    assert body["requested_reconsideration_text"]
