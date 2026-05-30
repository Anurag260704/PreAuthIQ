"""Normalized text matching for promotion rules."""

from __future__ import annotations

import re
from typing import List


def normalize_match_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s]", "", text)
    return text.strip()


def notes_contain_any(text: str, patterns: List[str]) -> bool:
    normalized = normalize_match_text(text)
    for pattern in patterns:
        if normalize_match_text(pattern) in normalized:
            return True
    return False


def notes_contain_all(text: str, patterns: List[str]) -> bool:
    normalized = normalize_match_text(text)
    for pattern in patterns:
        if normalize_match_text(pattern) not in normalized:
            return False
    return True


def notes_contain_plain_all(text: str, patterns: List[str]) -> bool:
    lowered = text.lower()
    for pattern in patterns:
        if pattern.lower() not in lowered:
            return False
    return True
