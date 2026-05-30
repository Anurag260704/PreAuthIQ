"""Load policy criteria from YAML data files."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Dict, List

import yaml

from core.policy.matcher import resolve_policy_key
from core.policy.types import Criterion

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "policies"


def _yaml_entry_to_criterion(entry: dict) -> Criterion:
    return Criterion(
        criterion_id=str(entry["id"]),
        criterion_name=str(entry["name"]),
        description=str(entry.get("description", "")).strip(),
    )


@lru_cache(maxsize=1)
def _load_all_policies() -> Dict[str, List[Criterion]]:
    policies: Dict[str, List[Criterion]] = {}
    for path in sorted(DATA_DIR.glob("*.yaml")):
        if path.name == "service_match_rules.yaml":
            continue
        policy_key = path.stem
        entries = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(entries, list):
            continue
        policies[policy_key] = [_yaml_entry_to_criterion(entry) for entry in entries]
    if "default" not in policies:
        raise RuntimeError("default policy file is required")
    return policies


def get_criteria_for_policy(policy_key: str) -> List[Criterion]:
    policies = _load_all_policies()
    return list(policies.get(policy_key, policies["default"]))


def resolve_policy_rules(requested_service: str) -> List[Criterion]:
    policy_key = resolve_policy_key(requested_service)
    return get_criteria_for_policy(policy_key)


def format_criteria_for_prompt(criteria: List[Criterion]) -> str:
    lines: List[str] = []
    for criterion in criteria:
        description = criterion["description"].replace("{", "{{").replace("}", "}}")
        lines.append(f"{criterion['criterion_id']}: {criterion['criterion_name']}")
        lines.append(f"    Description: {description}")
        lines.append("")
    return "\n".join(lines)


__all__ = [
    "Criterion",
    "format_criteria_for_prompt",
    "get_criteria_for_policy",
    "resolve_policy_key",
    "resolve_policy_rules",
]
