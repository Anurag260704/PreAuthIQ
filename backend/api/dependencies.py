"""API dependency providers."""

import asyncio
import os
from typing import Optional

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.engine import AuthorizationEngine

API_KEY = os.environ.get("API_KEY", "")
bearer_scheme = HTTPBearer(auto_error=False)
_benchmark_semaphore: Optional[asyncio.Semaphore] = None


def get_benchmark_semaphore() -> asyncio.Semaphore:
    global _benchmark_semaphore
    if _benchmark_semaphore is None:
        _benchmark_semaphore = asyncio.Semaphore(1)
    return _benchmark_semaphore


def get_engine() -> AuthorizationEngine:
    return AuthorizationEngine()


async def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> str:
    if not API_KEY:
        return "dev"
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide Authorization: Bearer <key>",
        )
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials.credentials
