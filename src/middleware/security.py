from fastapi import FastAPI, Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from typing import Callable
import time
import re
import bleach
from src.core.config import settings
from src.services.security import SecurityService

security_service = SecurityService()

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Rate limiting check
        client_ip = request.client.host
        if await self._is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"}
            )

        # Input sanitization for query params and body
        await self._sanitize_request(request)

        # Security headers
        response = await call_next(request)
        self._add_security_headers(response)

        # GDPR logging
        if request.method in ["POST", "PUT", "DELETE"]:
            await security_service.log_data_access(
                user_id=request.state.user.id if hasattr(request.state, "user") else None,
                data_type=request.url.path,
                action=request.method
            )

        return response

    async def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if the client has exceeded rate limits."""
        from redis import Redis
        redis = Redis.from_url(settings.REDIS_URL)
        key = f"rate_limit:{client_ip}"
        current = redis.get(key)
        
        if current is None:
            redis.setex(key, settings.RATE_LIMIT_PERIOD, 1)
            return False
            
        current = int(current)
        if current >= settings.RATE_LIMIT_REQUESTS:
            return True
            
        redis.incr(key)
        return False

    async def _sanitize_request(self, request: Request):
        """Sanitize input data to prevent XSS and injection attacks."""
        # Sanitize query parameters
        cleaned_query_params = {}
        for key, value in request.query_params.items():
            cleaned_key = bleach.clean(key)
            cleaned_value = bleach.clean(value)
            cleaned_query_params[cleaned_key] = cleaned_value
        request.scope["query_string"] = "&".join(
            f"{k}={v}" for k, v in cleaned_query_params.items()
        ).encode()

        # Sanitize request body if it's form data
        if request.method in ["POST", "PUT"] and request.headers.get("content-type") == "application/x-www-form-urlencoded":
            form_data = await request.form()
            cleaned_form = {}
            for key, value in form_data.items():
                cleaned_key = bleach.clean(key)
                cleaned_value = bleach.clean(value)
                cleaned_form[cleaned_key] = cleaned_value
            request._form = cleaned_form

    def _add_security_headers(self, response: Response):
        """Add security headers to response."""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://*.supabase.co https://*.openrouter.ai https://*.cerebras.ai;"
        )

class GDPRMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check for GDPR consent
        if not self._has_gdpr_consent(request):
            return JSONResponse(
                status_code=403,
                content={"detail": "GDPR consent required"}
            )

        response = await call_next(request)

        # Data minimization
        if isinstance(response, JSONResponse):
            data = response.body
            sanitized_data = security_service.sanitize_data_for_gdpr(data)
            response.body = sanitized_data

        # Add GDPR-related headers
        response.headers["X-Data-Processing-Basis"] = "consent"
        response.headers["X-Data-Retention-Period"] = f"{settings.DATA_RETENTION_DAYS} days"
        response.headers["X-Privacy-Contact"] = settings.PRIVACY_CONTACT_EMAIL

        return response

    def _has_gdpr_consent(self, request: Request) -> bool:
        """Check if the user has provided GDPR consent."""
        consent_cookie = request.cookies.get("gdpr_consent")
        return consent_cookie == "accepted"

def setup_security_middleware(app: FastAPI):
    """Set up all security-related middleware."""
    app.add_middleware(SecurityMiddleware)
    app.add_middleware(GDPRMiddleware)