import hashlib
import secrets
import uuid
from datetime import timedelta, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import redis.asyncio as aioredis

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token, decode_token
from app.utils.exceptions import UnauthorizedError, ConflictError, NotFoundError
from app.config import settings


# ---------------------------------------------------------------------------
# Redis key helpers
# ---------------------------------------------------------------------------

def _refresh_key(token_hash: str) -> str:
    return f"refresh:{token_hash}"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Auth Service
# ---------------------------------------------------------------------------

class AuthService:

    # -----------------------------------------------------------------------
    # Register
    # -----------------------------------------------------------------------
    async def register(
        self,
        db: AsyncSession,
        data: RegisterRequest,
    ) -> TokenResponse:
        # Check duplicate email
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise ConflictError("An account with this email already exists.")

        # Create user
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
        )
        db.add(user)
        await db.flush()  # get user.id without committing

        # Create role-specific profile
        if data.role == UserRole.patient:
            profile = Patient(user_id=user.id, name=data.name)
            db.add(profile)
        elif data.role == UserRole.doctor:
            profile = Doctor(
                user_id=user.id,
                name=data.name,
                specialty="General",  # Admin will update later
            )
            db.add(profile)
        # admin: no profile table required

        await db.commit()
        await db.refresh(user)

        # For registration, return tokens immediately (auto-login)
        return await self._issue_tokens(user)

    # -----------------------------------------------------------------------
    # Login
    # -----------------------------------------------------------------------
    async def login(
        self,
        db: AsyncSession,
        redis: aioredis.Redis,
        data: LoginRequest,
    ) -> TokenResponse:
        result = await db.execute(select(User).where(User.email == data.email))
        user: User | None = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedError("Your account has been deactivated.")

        tokens = await self._issue_tokens(user)

        # Store refresh token in Redis (single-use, TTL = 7 days)
        token_hash = _hash_token(tokens.refresh_token)
        await redis.setex(
            _refresh_key(token_hash),
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            str(user.id),
        )

        return tokens

    # -----------------------------------------------------------------------
    # Refresh token (single-use rotation)
    # -----------------------------------------------------------------------
    async def refresh(
        self,
        db: AsyncSession,
        redis: aioredis.Redis,
        refresh_token: str,
    ) -> TokenResponse:
        # Validate JWT structure
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise UnauthorizedError("Invalid or expired refresh token.")

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Token type mismatch.")

        # Check Redis — single-use enforcement
        token_hash = _hash_token(refresh_token)
        redis_key = _refresh_key(token_hash)
        stored_user_id = await redis.get(redis_key)

        if not stored_user_id:
            raise UnauthorizedError("Refresh token has been revoked or already used.")

        # DELETE old token immediately (rotation)
        await redis.delete(redis_key)

        # Fetch user
        result = await db.execute(select(User).where(User.id == uuid.UUID(stored_user_id)))
        user: User | None = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive.")

        # Issue new token pair
        new_tokens = await self._issue_tokens(user)

        # Store new refresh token
        new_hash = _hash_token(new_tokens.refresh_token)
        await redis.setex(
            _refresh_key(new_hash),
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            str(user.id),
        )

        return new_tokens

    # -----------------------------------------------------------------------
    # Logout — invalidate refresh token
    # -----------------------------------------------------------------------
    async def logout(
        self,
        redis: aioredis.Redis,
        refresh_token: str,
    ) -> None:
        token_hash = _hash_token(refresh_token)
        await redis.delete(_refresh_key(token_hash))

    # -----------------------------------------------------------------------
    # Get current user from access token
    # -----------------------------------------------------------------------
    async def get_current_user(
        self,
        db: AsyncSession,
        token: str,
    ) -> User:
        try:
            payload = decode_token(token)
        except Exception:
            raise UnauthorizedError("Invalid or expired access token.")

        if payload.get("type") != "access":
            raise UnauthorizedError("Token type mismatch.")

        user_id = uuid.UUID(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user: User | None = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive.")

        return user

    # -----------------------------------------------------------------------
    # Internal: build token response
    # -----------------------------------------------------------------------
    async def _issue_tokens(self, user: User) -> TokenResponse:
        access = create_access_token(subject=user.id, role=user.role.value)
        refresh = create_refresh_token(subject=user.id, role=user.role.value)

        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            token_type="bearer",
            role=user.role.value,
            user_id=user.id,
            name="",   # Populated by router after profile join
            email=user.email,
        )


auth_service = AuthService()
