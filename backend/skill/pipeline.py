"""
Legacy pipeline entry point.

Delegates to the core AuthorizationEngine. Prefer `core.engine.run_engine`
for new integrations.
"""

from core.engine import run_engine
from skill.schema import PreAuthCaseInput, PreAuthSkillOutput


async def run_pipeline(case_input: PreAuthCaseInput) -> PreAuthSkillOutput:
    return await run_engine(case_input)
