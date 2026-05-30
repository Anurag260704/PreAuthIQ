"""YAML-driven promotion rule evaluation."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List, MutableMapping

import yaml

from core.models import PreAuthCaseInput
from core.report.payload_utils import get_criteria_results
from core.report.text_match import notes_contain_all, notes_contain_any, notes_contain_plain_all

RULES_PATH = Path(__file__).resolve().parents[2] / "data" / "promotion_rules.yaml"


@dataclass(frozen=True)
class PromotionRule:
    rule_id: str
    when_recommendation: str
    service_tokens: List[str]
    notes_any: List[str]
    notes_all: List[str]
    notes_any_secondary: List[str]
    notes_any_tertiary: List[str]
    notes_plain_all: List[str]
    promote_to: str
    confidence: str


@lru_cache(maxsize=1)
def _load_rules() -> List[PromotionRule]:
    payload = yaml.safe_load(RULES_PATH.read_text(encoding="utf-8"))
    rules: List[PromotionRule] = []
    for entry in payload.get("rules", []):
        rules.append(
            PromotionRule(
                rule_id=str(entry["id"]),
                when_recommendation=str(entry["when_recommendation"]),
                service_tokens=[str(token) for token in entry.get("service_tokens", [])],
                notes_any=[str(token) for token in entry.get("notes_any", [])],
                notes_all=[str(token) for token in entry.get("notes_all", [])],
                notes_any_secondary=[
                    str(token) for token in entry.get("notes_any_secondary", [])
                ],
                notes_any_tertiary=[
                    str(token) for token in entry.get("notes_any_tertiary", [])
                ],
                notes_plain_all=[str(token) for token in entry.get("notes_plain_all", [])],
                promote_to=str(entry["promote_to"]),
                confidence=str(entry["confidence"]),
            )
        )
    return rules


def _apply_approval_promotion(
    payload: MutableMapping[str, object], confidence: str
) -> None:
    payload["recommendation"] = "LIKELY_APPROVE"
    payload["confidence"] = confidence
    payload["provider_query"] = ""
    payload["appeal_direction"] = None
    payload["flip_condition"] = None


def _rule_matches(
    rule: PromotionRule,
    requested_service: str,
    raw_text: str,
) -> bool:
    if not any(token in requested_service for token in rule.service_tokens):
        return False
    if rule.notes_any and not notes_contain_any(raw_text, rule.notes_any):
        return False
    if rule.notes_all and not notes_contain_all(raw_text, rule.notes_all):
        return False
    if rule.notes_any_secondary and not notes_contain_any(raw_text, rule.notes_any_secondary):
        return False
    if rule.notes_any_tertiary and not notes_contain_any(raw_text, rule.notes_any_tertiary):
        return False
    if rule.notes_plain_all and not notes_contain_plain_all(raw_text, rule.notes_plain_all):
        return False
    return True


def apply_promotion_rules(
    payload: MutableMapping[str, object], case_input: PreAuthCaseInput
) -> None:
    recommendation = str(payload.get("recommendation") or "")
    if recommendation != "NEED_MORE_INFO":
        return

    criteria_results = get_criteria_results(payload)
    if any(result.get("status") == "UNMET" for result in criteria_results):
        return

    requested_service = case_input.requested_service.lower()
    raw_text = case_input.raw_clinical_notes or ""

    for rule in _load_rules():
        if rule.when_recommendation != "NEED_MORE_INFO":
            continue
        if _rule_matches(rule, requested_service, raw_text):
            _apply_approval_promotion(payload, confidence=rule.confidence)
            return
