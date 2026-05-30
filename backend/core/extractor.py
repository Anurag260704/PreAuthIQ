"""Step 1: clinical field extraction."""

import re
from typing import Dict, cast

from core.exceptions import ExtractionError, LLMClientError
from core.llm_json import LLMJSONParseError, complete_and_parse_json
from core.models import PreAuthCaseInput
from core.prompt_templates import NORMALIZATION_SYSTEM_PROMPT, build_normalization_user_message
from core.providers import LLMProvider


def _extract_treatment_signals(raw_notes: str) -> list[str]:
    patterns = [
        (r"\bphysical therapy\b|\bpt\b", "Physical therapy"),
        (r"\bnsaid[s]?\b", "NSAIDs"),
        (r"\bgabapentin\b", "Gabapentin"),
        (r"\bmuscle relaxant[s]?\b", "Muscle relaxants"),
        (r"\besi\b|\bepidural steroid injection\b", "Epidural steroid injection"),
        (r"\binjection[s]?\b", "Injections"),
    ]
    found: list[str] = []
    lowered = raw_notes.lower()
    for pattern, label in patterns:
        if re.search(pattern, lowered):
            found.append(label)
    return list(dict.fromkeys(found))


def _enrich_extracted_fields(
    extracted_fields: Dict[str, object],
    clinical_input: PreAuthCaseInput,
) -> Dict[str, object]:
    if extracted_fields.get("age") is None and clinical_input.age is not None:
        extracted_fields["age"] = clinical_input.age

    raw_notes = clinical_input.raw_clinical_notes or ""
    if raw_notes and not extracted_fields.get("prior_conservative_treatment"):
        signals = _extract_treatment_signals(raw_notes)
        if signals:
            extracted_fields["prior_conservative_treatment"] = signals

    if (
        raw_notes
        and not extracted_fields.get("response_to_prior_treatment")
        and any(token in raw_notes.lower() for token in ["inadequate", "failed", "worsening"])
    ):
        extracted_fields["response_to_prior_treatment"] = (
            "Conservative treatment attempts documented with inadequate relief."
        )

    return extracted_fields


async def extract_clinical_fields(
    clinical_input: PreAuthCaseInput, provider: LLMProvider
) -> Dict[str, object]:
    user_message = build_normalization_user_message(
        cast(Dict[str, object], clinical_input.model_dump())
    )
    try:
        extracted = await complete_and_parse_json(
            provider,
            NORMALIZATION_SYSTEM_PROMPT,
            user_message,
            step="extract",
        )
        return _enrich_extracted_fields(extracted, clinical_input)
    except LLMJSONParseError as exc:
        raise ExtractionError(
            "extract",
            "Clinical extraction returned invalid JSON.",
            raw_llm_snippet=exc.raw[:300],
        ) from exc
    except LLMClientError:
        raise
    except Exception as exc:
        raise ExtractionError("extract", f"Clinical extraction failed: {exc}") from exc
