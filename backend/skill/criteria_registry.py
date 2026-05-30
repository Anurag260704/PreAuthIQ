"""Legacy re-export — prefer core.policy.catalog."""

from core.policy.catalog import (
    Criterion,
    format_criteria_for_prompt,
    get_criteria_for_policy,
    resolve_policy_key,
    resolve_policy_rules,
)


def get_criteria(requested_service: str) -> list[Criterion]:
    return resolve_policy_rules(requested_service)


__all__ = [
    "Criterion",
    "format_criteria_for_prompt",
    "get_criteria",
    "get_criteria_for_policy",
    "resolve_policy_key",
    "resolve_policy_rules",
]
