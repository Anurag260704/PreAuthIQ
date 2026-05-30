"""Pipeline orchestration runner."""

from __future__ import annotations

import logging
import time

from core.models import PreAuthSkillOutput
from core.pipeline.context import PipelineContext
from core.pipeline import steps

logger = logging.getLogger(__name__)


class PipelineRunner:
    @staticmethod
    async def run(context: PipelineContext) -> PreAuthSkillOutput:
        context.start_monotonic = time.monotonic()

        steps.run_preflight(context)
        steps.run_resolve_policy(context)
        await steps.run_extract(context)
        steps.run_validate(context)
        await steps.run_adjudicate(context)
        steps.run_audit(context)
        output = steps.run_compose(context)

        assert context.validation_context is not None
        logger.info(
            "Engine complete | case=%s verdict=%s quality=%.2f total=%dms",
            output.case_id,
            output.recommendation,
            context.validation_context["quality_score"],
            output.processing_time_ms,
        )
        return output
