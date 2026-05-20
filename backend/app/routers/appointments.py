from fastapi import APIRouter, Depends, Query
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.middleware.auth_middleware import get_current_user, require_admin, require_doctor, require_patient, require_any

from app.services.appointment_service import appointment_service
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentStatusUpdate,
    AppointmentResponse,
)
from app.utils.response import success_response
from app.services.audit_service import audit_service
from fastapi import Request

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", summary="Book a new appointment", status_code=201)
async def create_appointment(
    request: Request,
    body: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Book a new appointment (patient only)."""
    # Get patient ID from user
    from sqlalchemy import select
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError("Patient")

    appointment = await appointment_service.create_appointment(db, str(patient.id), body)
    # -------------------------------------------------------------------------
    # Audit Logging
    # -------------------------------------------------------------------------
    from app.models.doctor import Doctor
    dr_res = await db.execute(select(Doctor).where(Doctor.id == appointment.doctor_id))
    doctor = dr_res.scalar_one_or_none()
    
    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"Booked an appointment with **Dr. {doctor.name if doctor else 'Unknown'}**",
        entity="Appointment",
        entity_id=str(appointment.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "id": str(appointment.id),
            "patient_id": str(appointment.patient_id),
            "doctor_id": str(appointment.doctor_id),
            "date": appointment.date.isoformat(),
            "start_time": appointment.start_time.isoformat(),
            "status": appointment.status.value,
            "reason": appointment.reason,
            "created_at": appointment.created_at.isoformat(),
        },
        message="Appointment booked successfully.",
        status_code=201,
    )


@router.get("/me", summary="Get current user's appointments")
async def get_my_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any),

):
    """Get all appointments for current user (Patient or Doctor)."""
    from sqlalchemy import select
    from app.models.doctor import Doctor
    from app.models.patient import Patient

    if current_user.role == UserRole.patient:
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient:
            from app.utils.exceptions import NotFoundError
            raise NotFoundError("Patient")
        appointments = await appointment_service.get_patient_appointments(db, str(patient.id))
    elif current_user.role == UserRole.doctor:
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()
        if not doctor:
            from app.utils.exceptions import NotFoundError
            raise NotFoundError("Doctor")
        # Fetch all appointments for this doctor
        appointments = await appointment_service.get_doctor_appointments_today(db, str(doctor.id), today_only=False)
    else:
        # Admin - maybe show all? Or error. For now, empty list for admin if they hit /me
        return success_response(data=[], message="Admins should use the global appointments endpoint.")

    # Enrichment for my appointments
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from sqlalchemy import select as sa_select

    patient_ids = list(set(str(a.patient_id) for a in appointments))
    doctor_ids = list(set(str(a.doctor_id) for a in appointments))
    
    patient_map = {}
    if patient_ids:
        p_rows = await db.execute(sa_select(Patient).where(Patient.id.in_(patient_ids)))
        patient_map = {str(p.id): p.name for p in p_rows.scalars().all()}
        
    doctor_map = {}
    if doctor_ids:
        d_rows = await db.execute(sa_select(Doctor).where(Doctor.id.in_(doctor_ids)))
        doctor_map = {str(d.id): d.name for d in d_rows.scalars().all()}

    return success_response(
        data=[
            {
                "id": str(a.id),
                "patient_id": str(a.patient_id),
                "patient_name": patient_map.get(str(a.patient_id), "Unknown Patient"),
                "doctor_id": str(a.doctor_id),
                "doctor_name": doctor_map.get(str(a.doctor_id), "Unknown Doctor"),
                "date": a.date.isoformat(),
                "start_time": a.start_time.isoformat(),
                "status": a.status.value,
                "reason": a.reason,
                "created_at": a.created_at.isoformat(),
            }
            for a in appointments
        ],
        message="Appointments retrieved successfully.",
    )



@router.delete("/me/{appointment_id}", summary="Cancel appointment")
async def cancel_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Cancel own appointment (patient only)."""
    from sqlalchemy import select
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError("Patient")

    appointment = await appointment_service.cancel_appointment(db, appointment_id, str(patient.id))
    return success_response(
        data={
            "id": str(appointment.id),
            "status": appointment.status.value,
        },
        message="Appointment cancelled successfully.",
    )


@router.get("", summary="Get all appointments (admin)")
async def get_all_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    status: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    """Get all appointments (admin only, with optional filters)."""
    appointments = await appointment_service.get_all_appointments(
        db,
        status=status,
        date_from=date_from,
        date_to=date_to,
    )
    
    # Enrichment
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from sqlalchemy import select as sa_select

    patient_ids = list(set(str(a.patient_id) for a in appointments))
    doctor_ids = list(set(str(a.doctor_id) for a in appointments))
    
    patient_map = {}
    if patient_ids:
        p_rows = await db.execute(sa_select(Patient).where(Patient.id.in_(patient_ids)))
        patient_map = {str(p.id): p.name for p in p_rows.scalars().all()}
        
    doctor_map = {}
    if doctor_ids:
        d_rows = await db.execute(sa_select(Doctor).where(Doctor.id.in_(doctor_ids)))
        doctor_map = {str(d.id): d.name for d in d_rows.scalars().all()}

    return success_response(
        data=[
            {
                "id": str(a.id),
                "patient_id": str(a.patient_id),
                "patient_name": patient_map.get(str(a.patient_id), "Unknown Patient"),
                "doctor_id": str(a.doctor_id),
                "doctor_name": doctor_map.get(str(a.doctor_id), "Unknown Doctor"),
                "date": a.date.isoformat(),
                "start_time": a.start_time.isoformat(),
                "status": a.status.value,
                "created_at": a.created_at.isoformat(),
            }
            for a in appointments
        ],
        message="Appointments retrieved successfully.",
    )


@router.get("/today", summary="Get doctor's appointments for today")
async def get_doctor_appointments_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Get doctor's queue for today (doctor only), enriched with patient name."""
    from app.services.doctor_service import doctor_service
    from app.models.patient import Patient
    from sqlalchemy import select as sa_select

    doctor = await doctor_service.get_doctor_by_user_id(db, str(current_user.id))
    appointments = await appointment_service.get_doctor_appointments_today(db, str(doctor.id))

    # Bulk-fetch patient names to avoid N+1 queries
    patient_ids = [str(a.patient_id) for a in appointments]
    patient_rows = await db.execute(
        sa_select(Patient).where(Patient.id.in_(patient_ids))
    )
    patient_map = {str(p.id): p.name for p in patient_rows.scalars().all()}

    return success_response(
        data=[
            {
                "id": str(a.id),
                "patient_id": str(a.patient_id),
                "patient_name": patient_map.get(str(a.patient_id), "Unknown Patient"),
                "date": a.date.isoformat(),
                "start_time": a.start_time.isoformat(),
                "status": a.status.value,
                "queue_number": a.queue_number,
                "reason": a.reason,
                "created_at": a.created_at.isoformat(),
            }
            for i, a in enumerate(appointments)
        ],
        message="Today's appointments retrieved successfully.",
    )



@router.patch("/{appointment_id}/status", summary="Update appointment status")
async def update_appointment_status(
    request: Request,
    appointment_id: str,
    body: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Update appointment status (doctor only)."""
    appointment = await appointment_service.update_appointment_status(db, appointment_id, body)
    # -------------------------------------------------------------------------
    # Audit Logging
    # -------------------------------------------------------------------------
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    from sqlalchemy import select as sa_select
    
    dr_res = await db.execute(sa_select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = dr_res.scalar_one_or_none()
    
    pat_res = await db.execute(sa_select(Patient).where(Patient.id == appointment.patient_id))
    patient = pat_res.scalar_one_or_none()

    status_label = appointment.status.value.replace("_", " ").capitalize()
    
    await audit_service.log_activity(
        db,
        user_id=current_user.id,
        action=f"Updated **{patient.name if patient else 'Patient'}'s** appointment status to **{status_label}**",
        entity="Appointment",
        entity_id=str(appointment.id),
        ip_address=request.client.host,
        request_id=request.headers.get("X-Request-ID")
    )
    request.state.audit_logged = True

    return success_response(
        data={
            "id": str(appointment.id),
            "status": appointment.status.value,
            "updated_at": appointment.updated_at.isoformat(),
        },
        message="Appointment status updated successfully.",
    )


@router.post("/{appointment_id}/notes", summary="Add notes to appointment")
async def add_appointment_notes(
    appointment_id: str,
    body: dict,  # {"content": "..."}
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Add consultation notes to appointment (doctor only)."""
    from app.models.consultation_note import ConsultationNote
    from app.services.doctor_service import doctor_service

    doctor = await doctor_service.get_doctor_by_user_id(db, str(current_user.id))
    appointment = await appointment_service.get_appointment_by_id(db, appointment_id)

    note = ConsultationNote(
        appointment_id=appointment.id,
        doctor_id=doctor.id,
        content=body.get("content", ""),
    )
    db.add(note)
    appointment.notes_count = (appointment.notes_count or 0) + 1
    await db.commit()
    await db.refresh(note)

    return success_response(
        data={
            "id": str(note.id),
            "content": note.content,
            "created_at": note.created_at.isoformat(),
        },
        message="Note added successfully.",
        status_code=201,
    )


@router.get("/{appointment_id}/notes", summary="Get appointment notes")
async def get_appointment_notes(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Get all consultation notes for an appointment (doctor only)."""
    from sqlalchemy import select
    from app.models.consultation_note import ConsultationNote

    result = await db.execute(
        select(ConsultationNote).where(ConsultationNote.appointment_id == appointment_id)
    )
    notes = result.scalars().all()

    return success_response(
        data=[
            {
                "id": str(n.id),
                "content": n.content,
                "created_at": n.created_at.isoformat(),
            }
            for n in notes
        ],
        message="Notes retrieved successfully.",
    )

@router.delete("/me/{appointment_id}", summary="Cancel an appointment")
async def cancel_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Cancel an appointment (patient only)."""
    # Get patient ID
    from sqlalchemy import select
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError("Patient")

    await appointment_service.cancel_appointment(db, appointment_id, str(patient.id))
    return success_response(message="Appointment cancelled successfully.")
