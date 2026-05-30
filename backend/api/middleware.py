"""Reusable middleware utilities."""

import logging
import os
from typing import List, Optional
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from core.config import MAX_REQUEST_BODY_BYTES

logger = logging.getLogger(__name__)


class RequestBodyTooLarge(Exception):
    pass


class RequestSizeLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        content_length: Optional[int] = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"content-length":
                try:
                    content_length = int(header_value.decode("latin-1"))
                except ValueError:
                    content_length = None
                break

        if content_length is not None and content_length > self.max_bytes:
            await JSONResponse(
                {"detail": f"Request body too large. Max {self.max_bytes} bytes."},
                status_code=413,
            )(scope, receive, send)
            return

        bytes_seen = 0

        async def limited_receive() -> Message:
            nonlocal bytes_seen
            message = await receive()
            if message["type"] == "http.request":
                bytes_seen += len(message.get("body", b""))
                if bytes_seen > self.max_bytes:
                    raise RequestBodyTooLarge
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestBodyTooLarge:
            await JSONResponse(
                {"detail": f"Request body too large. Max {self.max_bytes} bytes."},
                status_code=413,
            )(scope, receive, send)


def _normalize_origin(origin: str) -> Optional[str]:
    candidate = origin.strip().rstrip("/")
    if not candidate:
        return None
    parsed = urlsplit(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def _get_allowed_origins() -> List[str]:
    origin_sources = [
        os.environ.get("ALLOWED_ORIGINS", ""),
        os.environ.get("FRONTEND_URL", ""),
        os.environ.get("NEXT_PUBLIC_FRONTEND_URL", ""),
    ]
    local_dev = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    origins: List[str] = []
    seen: set[str] = set()
    for source in origin_sources:
        for raw in source.split(","):
            norm = _normalize_origin(raw)
            if norm and norm not in seen:
                seen.add(norm)
                origins.append(norm)
    if os.environ.get("ENVIRONMENT", "").lower() != "production":
        for origin in local_dev:
            if origin not in seen:
                seen.add(origin)
                origins.append(origin)
    logger.info("Configured CORS origins: %s", origins)
    return origins


def attach_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=MAX_REQUEST_BODY_BYTES)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )
