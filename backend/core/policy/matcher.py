"""Resolve requested_service strings to policy set keys."""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List

import yaml

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "policies"
MATCH_RULES_PATH = DATA_DIR / "service_match_rules.yaml"


@dataclass(frozen=True)
class ServiceMatchRule:
    keyword: str
    policy_key: str


def _normalize_service_text(value: str) -> str:
    lowered = value.lower()
    lowered = re.sub(r"[^\w\s/]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


@lru_cache(maxsize=1)
def _load_match_rules() -> List[ServiceMatchRule]:
    payload = yaml.safe_load(MATCH_RULES_PATH.read_text(encoding="utf-8"))
    rules: List[ServiceMatchRule] = []
    for entry in payload.get("rules", []):
        rules.append(
            ServiceMatchRule(
                keyword=str(entry["keyword"]),
                policy_key=str(entry["policy_key"]),
            )
        )
    return rules


def resolve_policy_key(requested_service: str) -> str:
    if not requested_service:
        return "default"

    normalized = _normalize_service_text(requested_service)
    for rule in _load_match_rules():
        if rule.keyword in normalized:
            return rule.policy_key
    return "default"
