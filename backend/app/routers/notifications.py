from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.services.notification_service import notification_service
from app.utils.response import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Get all notifications for current user")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all notifications for current user (unread first)."""
    notifications = await notification_service.get_user_notifications(db, str(current_user.id))
    return success_response(
        data=[
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        message="Notifications retrieved successfully.",
    )


@router.patch("/{notification_id}/read", summary="Mark notification as read")
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    notification = await notification_service.mark_notification_as_read(db, notification_id)
    return success_response(
        data={
            "id": str(notification.id),
            "is_read": notification.is_read,
        },
        message="Notification marked as read.",
    )


@router.post("/read-all", summary="Mark all notifications as read")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications for current user as read."""
    await notification_service.mark_all_as_read(db, str(current_user.id))
    return success_response(message="All notifications marked as read.")


@router.get("/unread-count", summary="Get unread notification count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of unread notifications for current user."""
    count = await notification_service.get_unread_count(db, str(current_user.id))
    return success_response(
        data={"unread_count": count},
        message="Unread count retrieved successfully.",
    )
