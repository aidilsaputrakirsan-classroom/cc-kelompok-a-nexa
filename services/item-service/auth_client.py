"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import time
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header, Request
from circuit_breaker import CircuitBreaker

# Circuit breaker instance (global — shared di seluruh app)
auth_circuit = CircuitBreaker(
    name="auth-service",
    failure_threshold=5,
    cooldown_seconds=30,
)

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

# =====================
# RETRY CONFIG
# =====================
MAX_RETRIES = 3
BASE_DELAY = 0.5           # 0.5 detik delay awal
TIMEOUT_SECONDS = 5.0      # Timeout per request

# Error yang layak di-retry (transient errors)
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}


async def _call_auth_service(
    authorization: str,
    correlation_id: str = None,
) -> dict:
    """Panggil Auth Service dengan Circuit Breaker + Retry + Correlation ID."""
    if not auth_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Auth Service circuit breaker OPEN. Try again later."
        )

    headers = {"Authorization": authorization}
    if correlation_id:
        headers["X-Correlation-ID"] = correlation_id

    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_SERVICE_URL}/verify",
                    headers=headers,
                    timeout=TIMEOUT_SECONDS,
                )

            if response.status_code == 200:
                auth_circuit.record_success()
                logger.info(
                    f"Auth verified (attempt {attempt})",
                    extra={"correlation_id": correlation_id},
                )
                return response.json()

            if response.status_code == 401:
                auth_circuit.record_success()
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                auth_circuit.record_success()
                raise HTTPException(status_code=400, detail="Bad auth request")

            if response.status_code in RETRYABLE_STATUS_CODES:
                logger.warning(
                    f"Auth service returned {response.status_code} "
                    f"(attempt {attempt}/{MAX_RETRIES})",
                    extra={"correlation_id": correlation_id},
                )
                last_exception = HTTPException(
                    status_code=response.status_code,
                    detail=f"Auth service error: {response.status_code}"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Unexpected auth response: {response.status_code}"
                )

        except httpx.ConnectError:
            logger.warning(
                f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES})",
                extra={"correlation_id": correlation_id},
            )
            last_exception = HTTPException(status_code=503, detail="Auth unavailable")

        except httpx.TimeoutException:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES})",
                extra={"correlation_id": correlation_id},
            )
            last_exception = HTTPException(status_code=504, detail="Auth timeout")

        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    auth_circuit.record_failure()
    raise HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(
    request: Request,
    authorization: str = Header(...),
) -> dict:
    """FastAPI Dependency: Verifikasi token dengan correlation ID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    correlation_id = getattr(request.state, "correlation_id", None)
    return await _call_auth_service(authorization, correlation_id)