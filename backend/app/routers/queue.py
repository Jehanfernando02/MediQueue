from fastapi import APIRouter, Depends
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.middleware.auth_middleware import get_current_user, require_patient, require_doctor
from app.services.queue_service import queue_service
from app.services.doctor_service import doctor_service
from app.utils.response import success_response
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/queue", tags=["Queue"])


@router.get("/my-position", summary="Get patient's queue position")
async def get_queue_position(
    doctor_id: str,
    appointment_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Get current patient's queue position for a doctor on a specific date."""
    from sqlalchemy import select

    # Get patient ID from user
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundError("Patient")

    position_data = await queue_service.calculate_patient_position(
        db,
        str(patient.id),
        doctor_id,
        appointment_date,
    )
    return success_response(
        data=position_data,
        message="Queue position retrieved successfully.",
    )


@router.get("/doctor/today", summary="Get doctor's queue stats for today")
async def get_doctor_queue_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Get queue statistics for current doctor today."""
    doctor = await doctor_service.get_doctor_by_user_id(db, str(current_user.id))

    stats = await queue_service.get_doctor_queue_today(db, str(doctor.id))
    return success_response(
        data=stats,
        message="Queue stats retrieved successfully.",
    )
