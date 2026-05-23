from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user, require_admin, require_doctor, require_any
from app.services.doctor_service import doctor_service
from app.services.appointment_service import appointment_service
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse
from app.utils.response import success_response
from app.services.audit_service import audit_service
from fastapi import Request

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", summary="Get all doctors")
async def get_doctors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of all doctors (accessible to patients and admins)."""
    doctors = await doctor_service.get_all_doctors(db)
    return success_response(
        data=[
            {
                "id": str(d.id),
                "name": d.name,
                "specialty": d.specialty,
                "department_id": str(d.department_id) if d.department_id else None,
                "status": d.status.value,
                "rating": d.rating,
                "review_count": d.review_count,
                "consultation_fee": d.consultation_fee,
                "created_at": d.created_at.isoformat(),
            }
            for d in doctors
        ],
        message="Doctors retrieved successfully.",
    )


@router.post("", summary="Create a new doctor", status_code=201)
async def create_doctor(
    request: Request,
    body: DoctorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new doctor (admin only)."""
    doctor = await doctor_service.create_doctor(db, body)
    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"Registered **Dr. {doctor.name}** as a new doctor",
        entity="Doctor Profile",
        entity_id=str(doctor.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "id": str(doctor.id),
            "name": doctor.name,
            "specialty": doctor.specialty,
            "department_id": str(doctor.department_id) if doctor.department_id else None,
            "status": doctor.status.value,
            "created_at": doctor.created_at.isoformat(),
        },
        message="Doctor created successfully.",
        status_code=201,
    )


@router.get("/{doctor_id}", summary="Get doctor by ID")
async def get_doctor(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single doctor by ID."""
    doctor = await doctor_service.get_doctor_by_id(db, doctor_id)
    return success_response(
        data={
            "id": str(doctor.id),
            "name": doctor.name,
            "specialty": doctor.specialty,
            "department_id": str(doctor.department_id) if doctor.department_id else None,
            "status": doctor.status.value,
            "rating": doctor.rating,
            "review_count": doctor.review_count,
            "consultation_fee": doctor.consultation_fee,
            "created_at": doctor.created_at.isoformat(),
        },
        message="Doctor retrieved successfully.",
    )


@router.patch("/{doctor_id}", summary="Update a doctor")
async def update_doctor(
    request: Request,
    doctor_id: str,
    body: DoctorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update doctor profile (admin only)."""
    doctor = await doctor_service.update_doctor(db, doctor_id, body)
    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"Updated profile for **Dr. {doctor.name}**",
        entity="Doctor Profile",
        entity_id=str(doctor.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "id": str(doctor.id),
            "name": doctor.name,
            "specialty": doctor.specialty,
            "status": doctor.status.value,
            "created_at": doctor.created_at.isoformat(),
        },
        message="Doctor updated successfully.",
    )


@router.delete("/{doctor_id}", summary="Delete a doctor")
async def delete_doctor(
    request: Request,
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a doctor (admin only)."""
    doctor = await doctor_service.get_doctor_by_id(db, doctor_id)
    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"Removed **Dr. {doctor.name}** from the system",
        entity="Doctor Profile",
        entity_id=str(doctor.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    await doctor_service.delete_doctor(db, doctor_id)
    return success_response(message="Doctor deleted successfully.")


@router.get("/me/schedule", summary="Get current doctor's schedule")
async def get_doctor_schedule(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Get current doctor's weekly availability and appointments."""
    doctor = await doctor_service.get_doctor_by_user_id(db, str(current_user.id))
    schedule = await doctor_service.get_weekly_schedule(db, str(doctor.id))
    return success_response(
        data=schedule,
        message="Weekly schedule retrieved successfully.",
    )


@router.get("/me/patients", summary="Get current doctor's patients")
async def get_doctor_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Get list of patients seen by current doctor."""
    from app.services.doctor_service import doctor_service
    from app.models.patient import Patient
    from sqlalchemy import select as sa_select
    from datetime import date

    doctor = await doctor_service.get_doctor_by_user_id(db, str(current_user.id))
    # Fetch unique patient IDs from appointments with this doctor
    appointments = await appointment_service.get_doctor_appointments_today(db, str(doctor.id), today_only=False)
    patient_ids = list(set(str(a.patient_id) for a in appointments))

    if not patient_ids:
        return success_response(data=[], message="No patients found.")

    from sqlalchemy.orm import selectinload
    # Fetch patient profiles with user email
    patient_rows = await db.execute(
        sa_select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id.in_(patient_ids))
    )
    patients = patient_rows.scalars().all()

    def calculate_age(dob: date | None) -> int | None:
        if not dob: return None
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return success_response(
        data=[
            {
                "id": str(p.id),
                "name": p.name,
                "email": p.user.email if p.user else "N/A",
                "age": calculate_age(p.dob),
                "risk_score": getattr(p, 'risk_score', 'Moderate'),  # Fallback if field missing
                # In a real app, we'd fetch the last visit date properly
                "last_visit": next((a.date.isoformat() for a in appointments if str(a.patient_id) == str(p.id)), None),
                "risk_score": "Low", # Default for now
            }
            for p in patients
        ],
        message="Patients retrieved successfully.",
    )

@router.get("/{doctor_id}/slots", summary="Get available slots for a doctor")
async def get_doctor_slots(
    doctor_id: str,
    date_str: str = Query(..., alias="date", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get available slots for a doctor on a specific date."""
    from datetime import datetime
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        from app.utils.exceptions import ValidationError
        raise ValidationError("Invalid date format. Use YYYY-MM-DD.")

    slots = await doctor_service.get_available_slots(db, doctor_id, target_date)
    return success_response(
        data=slots,
        message="Doctor slots retrieved successfully.",
    )
