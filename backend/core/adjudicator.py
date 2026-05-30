"""Step 3: policy adjudication."""

from typing import Dict, Mapping, cast

from core.exceptions import AdjudicationError, LLMClientError
from core.llm_json import LLMJSONParseError, complete_and_parse_json
from core.models import PreAuthCaseInput
from core.policy_catalog import Criterion, format_criteria_for_prompt
from core.prompt_templates import (
    EVALUATION_SYSTEM_PROMPT_TEMPLATE,
    build_evaluation_user_message,
)
from core.providers import LLMProvider


async def adjudicate_policy(
    extracted_fields: Mapping[str, object],
    policy_rules: list[Criterion],
    clinical_input: PreAuthCaseInput,
    provider: LLMProvider,
) -> Dict[str, object]:
    rules_block = format_criteria_for_prompt(policy_rules)
    system_prompt = EVALUATION_SYSTEM_PROMPT_TEMPLATE.replace("{criteria_block}", rules_block)
    user_message = build_evaluation_user_message(
        case_id=clinical_input.case_id or "unknown",
        requested_service=clinical_input.requested_service,
        site_of_care=clinical_input.site_of_care or "not specified",
        normalized_case=extracted_fields,
    )

    try:
        return cast(
            Dict[str, object],
            await complete_and_parse_json(
                provider,
                system_prompt,
                user_message,
                step="adjudicate",
            ),
        )
    except LLMJSONParseError as exc:
        raise AdjudicationError(
            "adjudicate",
            "Policy adjudication returned invalid JSON.",
            raw_llm_snippet=exc.raw[:300],
        ) from exc
    except LLMClientError:
        raise
    except Exception as exc:
        raise AdjudicationError("adjudicate", f"Policy adjudication failed: {exc}") from exc
