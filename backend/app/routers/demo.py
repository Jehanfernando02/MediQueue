import logging
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.redis_client import get_redis
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.services.demo_service import demo_service
from app.services.auth_service import auth_service, _hash_token, _refresh_key
from app.services.audit_service import audit_service
from app.utils.response import success_response, error_response
from datetime import timedelta
from app.config import settings

logger = logging.getLogger("mediqueue.demo")
router = APIRouter(prefix="/demo", tags=["Demo Sandbox"])


@router.post("/seed", summary="Reset sandbox data and seed high-fidelity database")
async def seed_sandbox(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Wipes the database and seeds it with rich, realistic clinical data.
    Allows guests to inspect a fully-formed dashboard immediately.
    """
    try:
        logger.info("Demo seeding started by client")
        await demo_service.seed_sandbox_data(db)
        
        # Log this reset event in the fresh audit log!
        # Find the admin user we just seeded
        res = await db.execute(select(User).where(User.email == "admin@demo.mediqueue.org"))
        admin_user = res.scalar_one()
        
        await audit_service.log_activity(
            db,
            user_id=admin_user.id,
            action="**Interactive Demo Database Reset** triggered by guest session",
            entity="System",
            entity_id=str(admin_user.id),
            ip_address=request.client.host,
            request_id=request.headers.get("X-Request-ID")
        )
        request.state.audit_logged = True
        
        return success_response(
            data=None,
            message="Sandbox database seeded with premium mock data successfully."
        )
    except Exception as e:
        logger.exception("Failed to seed sandbox database")
        return error_response(
            message=f"Failed to seed database: {str(e)}",
            status_code=500
        )


@router.post("/login", summary="Fast bypass login for Demo Sandbox views")
async def demo_login(
    request: Request,
    role: str = Query(..., description="Role to login as: patient, doctor, or admin"),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Simulates a secure login for guests to quickly enter different dashboards
    without needing credentials or registration.
    """
    # Map role input to seeded demo emails
    email_map = {
        "admin": "admin@demo.mediqueue.org",
        "doctor": "doctor@demo.mediqueue.org",
        "patient": "patient@demo.mediqueue.org"
    }
    
    selected_role = role.lower().strip()
    if selected_role not in email_map:
        return error_response(
            message="Invalid role. Must be 'patient', 'doctor', or 'admin'.",
            status_code=400
        )
        
    email = email_map[selected_role]
    
    # Fetch demo user from database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        # If database is not seeded yet, seed it automatically!
        logger.warning("Demo user %s not found. Auto-seeding database first.", email)
        await demo_service.seed_sandbox_data(db)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        
    # Standard issue of JWT tokens (access + refresh)
    tokens = await auth_service._issue_tokens(user)
    
    # Store refresh token in Redis (single-use, TTL = 7 days)
    token_hash = _hash_token(tokens.refresh_token)
    await redis.setex(
        _refresh_key(token_hash),
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        str(user.id),
    )
    
    # Resolve display name from profile table
    name = ""
    if user.role == UserRole.patient:
        r = await db.execute(select(Patient).where(Patient.user_id == user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else "John Doe"
    elif user.role == UserRole.doctor:
        r = await db.execute(select(Doctor).where(Doctor.user_id == user.id))
        profile = r.scalar_one_or_none()
        name = profile.name if profile else "Dr. Allison Vance"
    else:
        name = "Clinic Administrator"
        
    # Log this demo entrance into the audit logs
    await audit_service.log_activity(
        db,
        user_id=user.id,
        action=f"Guest entered Demo Showcase as **{name}** ({user.role.value.capitalize()})",
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
        message=f"Bypassed authentication. Logged in as demo {selected_role}.",
    )
