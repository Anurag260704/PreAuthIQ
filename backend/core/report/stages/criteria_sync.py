"""Synchronize criteria_met lists with criteria_results statuses."""

from __future__ import annotations

import logging
from typing import Set

from core.report.context import AssemblyContext
from core.report.payload_utils import get_criteria_results, get_string_list

logger = logging.getLogger(__name__)


def run_criteria_sync_stage(context: AssemblyContext) -> None:
    payload = context.payload
    results = get_criteria_results(payload)
    criteria_met: Set[str] = set(get_string_list(payload, "criteria_met"))
    criteria_partial_or_unmet: Set[str] = set(
        get_string_list(payload, "criteria_partial_or_unmet")
    )

    for result in results:
        criterion_id = result.get("criterion_id")
        status = result.get("status")
        if not isinstance(criterion_id, str) or not isinstance(status, str):
            continue
        if status == "MET":
            if criterion_id not in criteria_met:
                logger.warning(
                    "Criterion %s is MET but missing from criteria_met. Auto-correcting.",
                    criterion_id,
                )
            criteria_met.add(criterion_id)
            criteria_partial_or_unmet.discard(criterion_id)
        elif status in {"PARTIAL", "UNMET"}:
            if criterion_id not in criteria_partial_or_unmet:
                logger.warning(
                    "Criterion %s is %s but missing from criteria_partial_or_unmet. Auto-correcting.",
                    criterion_id,
                    status,
                )
            criteria_partial_or_unmet.add(criterion_id)
            criteria_met.discard(criterion_id)
        else:
            criteria_met.discard(criterion_id)
            criteria_partial_or_unmet.discard(criterion_id)

    payload["criteria_met"] = sorted(criteria_met)
    payload["criteria_partial_or_unmet"] = sorted(criteria_partial_or_unmet)
