from fastapi import Depends, HTTPException, status, Request

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import auth_service
from app.utils.exceptions import ForbiddenError

bearer_scheme = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await auth_service.get_current_user(db, credentials.credentials)
    request.state.user = user
    return user



def require_roles(*roles: UserRole):
    """
    Dependency factory: require_roles(UserRole.admin, UserRole.doctor)
    Returns a FastAPI dependency that raises 403 if user's role is not in allowed set.
    """
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                f"This endpoint requires one of: {[r.value for r in roles]}"
            )
        return current_user
    return _check


# Convenience shorthands
require_admin = require_roles(UserRole.admin)
require_doctor = require_roles(UserRole.doctor, UserRole.admin)
require_patient = require_roles(UserRole.patient, UserRole.admin)
require_any = require_roles(UserRole.admin, UserRole.doctor, UserRole.patient)
