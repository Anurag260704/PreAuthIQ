"""Authorization engine orchestration."""

from core.models import PreAuthCaseInput, PreAuthSkillOutput
from core.pipeline import PipelineContext, PipelineRunner
from core.providers import LLMProvider, MistralProvider


class AuthorizationEngine:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.provider = provider or MistralProvider()

    async def process_case(self, clinical_input: PreAuthCaseInput) -> PreAuthSkillOutput:
        context = PipelineContext(
            clinical_input=clinical_input,
            provider=self.provider,
        )
        return await PipelineRunner.run(context)


async def run_engine(clinical_input: PreAuthCaseInput) -> PreAuthSkillOutput:
    return await AuthorizationEngine().process_case(clinical_input)
