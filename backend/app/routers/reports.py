from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth_middleware import require_admin
from app.services.analytics_service import analytics_service
from app.utils.response import success_response

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/overview", summary="System-wide overview for admin")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    """Fetch overview stats for admin dashboard."""
    stats = await analytics_service.get_system_overview(db)
    return success_response(data=stats)

@router.get("/department-load", summary="Department load analysis")
async def get_dept_load(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    """Fetch appointment load per department."""
    stats = await analytics_service.get_department_load(db)
    return success_response(data=stats)

@router.get("/trends", summary="Appointment trends for admin")
async def get_trends(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    """Fetch monthly appointment trends."""
    stats = await analytics_service.get_historical_trends(db)
    return success_response(data=stats)

@router.get("/export", summary="Export appointments to CSV")
async def export_appointments(
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    """Export filtered appointments to CSV."""
    from datetime import datetime
    from fastapi.responses import Response
    
    d_from = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    d_to = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    
    csv_content = await analytics_service.export_appointments_csv(db, d_from, d_to)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=appointments_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )
