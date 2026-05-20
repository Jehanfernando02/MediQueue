from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.audit_log import AuditLog
from app.middleware.auth_middleware import require_admin
from app.utils.response import success_response

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", summary="Get system audit logs")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    """Fetch audit logs (admin only)."""
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).offset(offset)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return success_response(
        data=[
            {
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "entity": log.entity,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
                "metadata": log.metadata_
            }
            for log in logs
        ],
        message="Audit logs retrieved successfully."
    )
