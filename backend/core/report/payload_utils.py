"""Shared payload list and text helpers."""

from __future__ import annotations

from typing import Dict, Iterable, List, MutableMapping, Set, cast

from core.report.types import RawCriterionResult, RawEvidenceSnippet


def get_string_list(payload: MutableMapping[str, object], key: str) -> List[str]:
    raw_value = payload.get(key, [])
    if not isinstance(raw_value, list):
        payload[key] = []
        return []
    raw_items = cast(List[object], raw_value)
    result = [item for item in raw_items if isinstance(item, str)]
    payload[key] = result
    return result


def get_criteria_results(payload: MutableMapping[str, object]) -> List[RawCriterionResult]:
    raw_results = payload.get("criteria_results", [])
    if not isinstance(raw_results, list):
        payload["criteria_results"] = []
        return []
    typed_results: List[RawCriterionResult] = []
    for item in raw_results:
        if isinstance(item, dict):
            typed_results.append(cast(RawCriterionResult, item))
    payload["criteria_results"] = typed_results
    return typed_results


def get_supporting_evidence(payload: MutableMapping[str, object]) -> List[RawEvidenceSnippet]:
    raw_items = payload.get("supporting_evidence", [])
    if not isinstance(raw_items, list):
        payload["supporting_evidence"] = []
        return []
    typed_items: List[RawEvidenceSnippet] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        raw_item = cast(Dict[str, object], item)
        source = raw_item.get("source")
        excerpt = raw_item.get("excerpt")
        if isinstance(source, str) and isinstance(excerpt, str):
            typed_items.append({"source": source, "excerpt": excerpt})
    payload["supporting_evidence"] = typed_items
    return typed_items


def dedupe_strings(items: Iterable[object]) -> List[str]:
    result: List[str] = []
    seen: Set[str] = set()
    for item in items:
        if not isinstance(item, str):
            continue
        cleaned = " ".join(item.split()).strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key not in seen:
            seen.add(key)
            result.append(cleaned)
    return result


def join_sentences(existing: str, addition: str) -> str:
    existing = existing.strip()
    addition = addition.strip()
    if not existing:
        return addition
    if not addition:
        return existing
    if addition.lower() in existing.lower():
        return existing
    return f"{existing} {addition}"


def join_with_semicolon(existing: str, addition: str) -> str:
    existing = existing.strip()
    addition = addition.strip()
    if not existing:
        return addition
    if not addition:
        return existing
    if addition.lower() in existing.lower():
        return existing
    return f"{existing}; {addition}"


def contains_excerpt(evidence_list: Iterable[RawEvidenceSnippet], needle: str) -> bool:
    needle_lower = needle.lower()
    for item in evidence_list:
        excerpt = item.get("excerpt")
        if isinstance(excerpt, str) and needle_lower in excerpt.lower():
            return True
    return False
