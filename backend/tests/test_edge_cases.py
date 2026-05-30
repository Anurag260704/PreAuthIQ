import asyncio
from typing import Any, Dict, cast

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import main
from core.models import PreAuthCaseInput
from skill.retry_utils import call_with_retry


@pytest.mark.parametrize(
    ("kwargs"),
    [
        {"requested_service": "x" * 501, "primary_diagnosis": "Valid diagnosis"},
        {"requested_service": "Valid service", "primary_diagnosis": "x" * 501},
    ],
)
def test_case_input_rejects_overlong_required_text(kwargs: Dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PreAuthCaseInput(**cast(Any, kwargs))


@pytest.mark.asyncio
async def test_call_with_retry_does_not_retry_permanent_errors() -> None:
    calls = 0

    async def fail() -> None:
        nonlocal calls
        calls += 1
        raise RuntimeError("401 unauthorized")

    with pytest.raises(RuntimeError):
        await call_with_retry(fail, max_retries=5)

    assert calls == 1


def test_status_endpoint_has_no_api_key_state() -> None:
    client = TestClient(main.app)
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "api_key_set" not in body


def test_call_with_retry_works_across_event_loops() -> None:
    async def succeed() -> str:
        return "ok"

    assert asyncio.run(call_with_retry(succeed)) == "ok"
