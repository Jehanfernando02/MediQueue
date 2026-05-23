from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import redis.asyncio as aioredis

from app.database import get_db
from app.redis_client import get_redis
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    TokenResponse, ForgotPasswordRequest,
)
from app.services.auth_service import auth_service
from app.middleware.auth_middleware import get_current_user
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.utils.response import success_response, error_response
from app.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", summary="Register a new account")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis | None = Depends(get_redis),
):
    tokens = await auth_service.register(db, body)

    # Enrich name from profile after commit
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one()
    name = body.name

    await audit_service.log_activity(
        db,
        user_id=user.id,
        action=f"New account created for **{body.name}** as **{body.role.value}**",
        entity="Account",
        entity_id=str(user.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role.value,
                "name": name,
            },
        },
        message="Account created successfully.",
        status_code=201,
    )


@router.post("/login", summary="Login and receive JWT tokens")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis | None = Depends(get_redis),
):
    tokens = await auth_service.login(db, redis, body)

    # Resolve display name from profile table
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one()

    name = ""
    if user.role == UserRole.patient:
        r = await db.execute(select(Patient).where(Patient.user_id == user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else ""
    elif user.role == UserRole.doctor:
        r = await db.execute(select(Doctor).where(Doctor.user_id == user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else ""
    else:
        name = user.email  # admin — no profile table

    await audit_service.log_activity(
        db,
        user_id=user.id,
        action=f"**{name}** logged into the system",
        entity="Security",
        entity_id=str(user.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role.value,
                "name": name,
            },
        },
        message="Logged in successfully.",
    )


@router.post("/refresh", summary="Rotate refresh token and get new access token")
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis | None = Depends(get_redis),
):
    tokens = await auth_service.refresh(db, redis, body.refresh_token)
    return success_response(
        data={
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": "bearer",
        },
        message="Tokens refreshed.",
    )


@router.post("/logout", summary="Invalidate refresh token")
async def logout(
    request: Request,
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis | None = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    # Resolve name for logging
    name = ""
    if current_user.role == UserRole.patient:
        r = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        p = r.scalar_one_or_none()
        name = p.name if p else current_user.email
    elif current_user.role == UserRole.doctor:
        r = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        p = r.scalar_one_or_none()
        name = p.name if p else current_user.email
    else:
        name = current_user.email

    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"**{name}** logged out",
        entity="Security",
        entity_id=str(current_user.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    await auth_service.logout(redis, body.refresh_token)
    return success_response(message="Logged out successfully.")


@router.post("/forgot-password", summary="Request a password reset link")
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if user exists — always return 200 to prevent email enumeration
    result = await db.execute(select(User).where(User.email == body.email))
    # TODO Phase 3: send real email via background task
    return success_response(
        message="If an account with that email exists, a reset link has been sent."
    )


@router.get("/me", summary="Get current authenticated user")
async def me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    name = ""
    if current_user.role == UserRole.patient:
        r = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else ""
    elif current_user.role == UserRole.doctor:
        r = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else ""
    else:
        name = current_user.email

    return success_response(
        data={
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "name": name,
            "is_active": current_user.is_active,
        }
    )


@router.patch("/me", summary="Update current authenticated user")
async def update_me(
    body: dict,  # {"name": "..."}
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile information."""
    new_name = body.get("name")
    if not new_name:
        return error_response(message="Name is required", status_code=400)

    if current_user.role == UserRole.patient:
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        profile = result.scalar_one_or_none()
        if profile:
            profile.name = new_name
    elif current_user.role == UserRole.doctor:
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        profile = result.scalar_one_or_none()
        if profile:
            profile.name = new_name
    
    # Commit changes to DB
    await db.commit()

    return success_response(
        data={"name": new_name},
        message="Profile updated successfully."
    )
