from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

import main
from core.engine import AuthorizationEngine
from core.models import PreAuthCaseInput
from core.validator import validate_and_enrich_input
from tests.stub_provider import StubProvider


def test_validator_quality_bounds() -> None:
    payload = PreAuthCaseInput(requested_service="X", primary_diagnosis="Y")
    context = validate_and_enrich_input(payload, {})
    assert 0.0 <= context["quality_score"] <= 1.0
    assert len(context["enrichment_hints"]) >= 1


def test_engine_attaches_validation_insights() -> None:
    engine = AuthorizationEngine(provider=StubProvider())
    output = asyncio.run(
        engine.process_case(
            PreAuthCaseInput(
                case_id="PA-EXT",
                requested_service="Cervical fusion",
                primary_diagnosis="Cervical myelopathy",
            )
        )
    )
    assert output.validation_insights is not None
    assert 0.0 <= output.validation_insights.quality_score <= 1.0
    assert output.consistency_score is not None
    assert output.contradiction_risk_index is not None
    assert output.appeal_readiness_score is not None
    assert 0.0 <= output.consistency_score <= 1.0
    assert 0.0 <= output.contradiction_risk_index <= 1.0
    assert 0.0 <= output.appeal_readiness_score <= 1.0


def test_api_v1_and_legacy_status_routes() -> None:
    client = TestClient(main.app)
    v1 = client.get("/api/v1/status")
    legacy = client.get("/api/health")
    assert v1.status_code == 200
    assert legacy.status_code == 200
