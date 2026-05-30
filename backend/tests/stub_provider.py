"""Deterministic LLM stub for pipeline parity tests."""

from __future__ import annotations

import json

from core.providers import LLMProvider


class StubProvider(LLMProvider):
    """Returns fixed JSON for extraction and adjudication calls."""

    def __init__(self) -> None:
        self.calls = 0

    async def complete(self, system_prompt: str, user_message: str) -> str:
        self.calls += 1
        if self.calls == 1:
            return json.dumps(
                {
                    "requested_service": "Cervical fusion",
                    "primary_diagnosis": "Cervical myelopathy",
                    "functional_impairment_adls": {
                        "value": "Cannot button shirt",
                        "source": "PT note",
                    },
                    "objective_neurologic_deficits": {
                        "value": "Hyperreflexia",
                        "source": "Neuro consult",
                    },
                    "supporting_evidence": [
                        {
                            "source": "Neuro consult",
                            "excerpt": "Hyperreflexia present",
                        }
                    ],
                }
            )
        return json.dumps(
            {
                "recommendation": "NEED_MORE_INFO",
                "confidence": "MEDIUM",
                "clinical_summary": (
                    "Clinical need likely but packet is missing a complete "
                    "site-of-care rationale."
                ),
                "criteria_results": [],
                "criteria_met": [],
                "criteria_partial_or_unmet": [],
                "supporting_evidence": [],
                "missing_information": ["Provide inpatient rationale"],
                "provider_query": "Please submit inpatient monitoring rationale.",
                "appeal_direction": None,
                "flip_condition": (
                    "Additional inpatient risk details would likely support approval."
                ),
            }
        )
