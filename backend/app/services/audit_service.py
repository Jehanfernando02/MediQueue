import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog

class AuditService:
    """Service for recording rich, context-aware activity logs."""

    async def log_activity(
        self,
        db: AsyncSession,
        user_id: uuid.UUID | str | None,
        action: str,
        entity: str,
        entity_id: str | None = None,
        metadata: dict | None = None,
        request_id: str | None = None,
        ip_address: str | None = None
    ) -> AuditLog:
        """
        Record a business-level activity log.
        Setting this manually prevents the middleware from creating a duplicate, generic log.
        """
        # Convert user_id to UUID if string
        u_id = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        
        audit_entry = AuditLog(
            user_id=u_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            metadata_=metadata,
            request_id=request_id,
            ip_address=ip_address
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry

audit_service = AuditService()
