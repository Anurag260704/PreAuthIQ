import json
import sys
from pathlib import Path
from typing import List, Optional, TypedDict, cast

import pytest
from typing_extensions import NotRequired

sys.path.insert(0, str(Path(__file__).parent.parent))

from conftest import run_engine_sync
from core.models import PreAuthCaseInput

DATA_DIR = Path(__file__).parent.parent / "data"


class TrainingCaseRecord(TypedDict):
    case_id: str
    requested_service: str
    clinical_scenario: NotRequired[str]
    key_supporting_evidence: NotRequired[str]
    key_gaps_or_risks: NotRequired[str]
    expected_outcome: str
    complexity_notes: NotRequired[Optional[str]]


def _load_training_cases() -> List[TrainingCaseRecord]:
    raw = json.loads((DATA_DIR / "training_cases.json").read_text())
    return [cast(TrainingCaseRecord, item) for item in cast(List[object], raw) if isinstance(item, dict)]


@pytest.mark.parametrize("case_id", ["PA-001", "PA-002", "PA-003"])
def test_engine_processes_sample_cases(case_id: str) -> None:
    case = next(case for case in _load_training_cases() if case["case_id"] == case_id)
    output = run_engine_sync(
        PreAuthCaseInput(
            case_id=case["case_id"],
            requested_service=case["requested_service"],
            primary_diagnosis=case.get("clinical_scenario") or "Unknown",
            raw_clinical_notes=(
                f"Clinical scenario: {case.get('clinical_scenario') or ''}\n"
                f"Supporting evidence: {case.get('key_supporting_evidence') or ''}\n"
                f"Gaps or risks: {case.get('key_gaps_or_risks') or ''}"
            ),
        )
    )
    assert output.case_id == case_id
    assert output.recommendation in {"LIKELY_APPROVE", "NEED_MORE_INFO", "LIKELY_DENY"}
    assert output.validation_insights is not None
