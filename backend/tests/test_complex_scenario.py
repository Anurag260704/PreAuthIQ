from scripts.run_complex_case import build_complex_case_input
from conftest import run_engine_sync


def test_engine_handles_complex_scenario() -> None:
    output = run_engine_sync(build_complex_case_input())
    assert output.recommendation == "NEED_MORE_INFO"
    assert output.flip_condition is not None
    assert output.validation_insights is not None
    assert output.validation_insights.quality_score <= 1.0
