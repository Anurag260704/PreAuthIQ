"""Policy criteria type definitions."""

from typing import TypedDict


class Criterion(TypedDict):
    criterion_id: str
    criterion_name: str
    description: str
