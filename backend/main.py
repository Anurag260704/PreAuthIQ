"""FastAPI bootstrap for MedClear API."""

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402

from api.middleware import attach_middleware  # noqa: E402
from api.routes import legacy_router, router  # noqa: E402

app = FastAPI(
    title="MedClear AI API",
    description="Versioned prior authorization adjudication service",
    version="2.0.0",
)

attach_middleware(app)
app.include_router(router)
app.include_router(legacy_router)
