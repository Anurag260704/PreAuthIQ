"""FastAPI bootstrap for PreAuthIQ API."""

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402

from api.middleware import attach_middleware  # noqa: E402
from api.routes import legacy_router, router  # noqa: E402

OPENAPI_TAGS = [
    {
        "name": "System",
        "description": "Health check and API metadata.",
    },
    {
        "name": "Review",
        "description": "Run the 4-step prior-auth skill on a case (JSON body or workbook upload).",
    },
    {
        "name": "Samples",
        "description": "Training cases and the PA-001 complex-case input from the assignment workbook.",
    },
    {
        "name": "Schema",
        "description": "Input/output field definitions (35-field intake model).",
    },
    {
        "name": "Benchmark",
        "description": "Batch validation over training cases. Requires `X-API-Key` when `API_KEY` is set.",
    },
]

app = FastAPI(
    title="PreAuthIQ API",
    description=(
        "Prior authorization copilot — structured clinical intake, "
        "policy adjudication, and reviewer-ready reports.\n\n"
        "**Primary API:** `/api/v1/*` (grouped below).\n\n"
        "Legacy `/api/*` aliases remain for backward compatibility but are hidden from this catalog."
    ),
    version="1.0.0",
    openapi_tags=OPENAPI_TAGS,
)

attach_middleware(app)
app.include_router(router)
app.include_router(legacy_router)
