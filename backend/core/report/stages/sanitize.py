"""Sanitize and repair LLM payload shapes."""

from __future__ import annotations

import logging
from typing import Dict, List, MutableMapping, cast

from core.report.context import AssemblyContext
from core.report.payload_utils import get_criteria_results
from core.report.types import RawCriterionResult

logger = logging.getLogger(__name__)

_VALID_STATUSES = {"MET", "PARTIAL", "UNMET", "N/A"}


def initialize_list_fields(payload: MutableMapping[str, object]) -> None:
    if payload.get("missing_information") is None:
        payload["missing_information"] = []
    if payload.get("supporting_evidence") is None:
        payload["supporting_evidence"] = []
    if payload.get("criteria_met") is None:
        payload["criteria_met"] = []
    if payload.get("criteria_partial_or_unmet") is None:
        payload["criteria_partial_or_unmet"] = []
    if payload.get("provider_query") is None:
        payload["provider_query"] = ""
    if payload.get("criteria_results") is None:
        payload["criteria_results"] = []


def repair_llm_field_shapes(payload: MutableMapping[str, object]) -> None:
    results = get_criteria_results(payload)
    expected_keys = {
        "criterion_id",
        "criterion_name",
        "status",
        "supporting_evidence",
        "gap_or_risk",
    }
    for result in results:
        for key, value in list(result.items()):
            if key not in expected_keys and isinstance(value, dict):
                nested = cast(Dict[str, object], value)
                nested_status = nested.get("status")
                if isinstance(nested_status, str) and nested_status in _VALID_STATUSES:
                    result["criterion_name"] = key
                    result["status"] = nested_status
                    for nested_key in ["supporting_evidence", "gap_or_risk"]:
                        nested_value = nested.get(nested_key)
                        if isinstance(nested_value, str) and nested_value:
                            if nested_key == "supporting_evidence" and "supporting_evidence" not in result:
                                result["supporting_evidence"] = nested_value
                            elif nested_key == "gap_or_risk" and "gap_or_risk" not in result:
                                result["gap_or_risk"] = nested_value
                    del result[key]
                    break

        if "criterion_name" not in result:
            extra_keys: List[str] = [key for key in result.keys() if key not in expected_keys]
            for key in extra_keys:
                value = result.get(key)
                if isinstance(value, str) and value in _VALID_STATUSES:
                    result["criterion_name"] = key
                    if "status" not in result:
                        result["status"] = value
                    break
            if "criterion_name" not in result:
                result["criterion_name"] = "Unknown Criterion"

        if result.get("gap_risk") is not None and result.get("gap_or_risk") is None:
            gap_risk = result.get("gap_risk")
            if isinstance(gap_risk, str):
                result["gap_or_risk"] = gap_risk
        if "gap_risk" in result:
            del result["gap_risk"]


def run_sanitize_stage(context: AssemblyContext) -> None:
    initialize_list_fields(context.payload)
    repair_llm_field_shapes(context.payload)
