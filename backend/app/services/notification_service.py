from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification import Notification
from app.utils.exceptions import NotFoundError


class NotificationService:
    """Service for notification CRUD operations."""

    async def create_notification(
        self,
        db: AsyncSession,
        user_id: str,
        notification_type: str,
        title: str,
        body: str,
    ) -> Notification:
        """Create a new notification for a user."""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[Notification]:
        """Fetch all notifications for a user (unread first)."""
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.is_read, Notification.created_at.desc())
        )
        return result.scalars().all()

    async def get_notification_by_id(
        self,
        db: AsyncSession,
        notification_id: str,
    ) -> Notification:
        """Fetch a single notification."""
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise NotFoundError("Notification")
        return notification

    async def mark_notification_as_read(
        self,
        db: AsyncSession,
        notification_id: str,
    ) -> Notification:
        """Mark a notification as read."""
        notification = await self.get_notification_by_id(db, notification_id)
        notification.is_read = True
        await db.commit()
        await db.refresh(notification)
        return notification

    async def mark_all_as_read(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> None:
        """Mark all notifications for a user as read."""
        await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        for notif in result.scalars():
            notif.is_read = True
        await db.commit()

    async def get_unread_count(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> int:
        """Get count of unread notifications."""
        from sqlalchemy import func

        result = await db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        return result.scalar() or 0


notification_service = NotificationService()
