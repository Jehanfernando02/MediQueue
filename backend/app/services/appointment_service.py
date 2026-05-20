from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.appointment import AppointmentCreate, AppointmentStatusUpdate
from app.utils.exceptions import NotFoundError, ConflictError, ValidationError


class AppointmentService:
    """Service for appointment booking, cancellation, and status updates."""

    async def create_appointment(
        self,
        db: AsyncSession,
        patient_id: str,
        data: AppointmentCreate,
    ) -> Appointment:
        """
        Book an appointment with conflict detection (DB-level locking).
        Prevents two patients booking same doctor at same time.
        """
        import uuid
        # Ensure UUID casting
        p_id = uuid.UUID(patient_id) if isinstance(patient_id, str) else patient_id
        d_id = data.doctor_id

        # Verify patient exists
        result = await db.execute(select(Patient).where(Patient.id == p_id))
        if not result.scalar_one_or_none():
            raise NotFoundError("Patient")

        # Verify doctor exists
        result = await db.execute(select(Doctor).where(Doctor.id == d_id))
        if not result.scalar_one_or_none():
            raise NotFoundError("Doctor")

        # 1. Verify slot is part of doctor's schedule
        from app.models.time_slot import TimeSlot
        slot_res = await db.execute(
            select(TimeSlot)
            .where(TimeSlot.doctor_id == d_id)
            .where(TimeSlot.day_of_week == data.date.weekday())
            .where(TimeSlot.start_time == data.start_time)
            .where(TimeSlot.is_active == True)
        )
        time_slot = slot_res.scalar_one_or_none()
        if not time_slot:
            raise ValidationError("This time is not part of the doctor's schedule.")

        # 2. CRITICAL: DB-level locking to prevent race conditions
        existing = await db.execute(
            select(Appointment)
            .where(Appointment.doctor_id == d_id)
            .where(Appointment.date == data.date)
            .where(Appointment.start_time == data.start_time)
            .where(
                Appointment.status.notin_(
                    [AppointmentStatus.cancelled, AppointmentStatus.no_show]
                )
            )
            .with_for_update()
        )

        if existing.scalar_one_or_none():
            raise ConflictError("This time slot is already booked.")

        # 3. Safe to create appointment
        appointment = Appointment(
            patient_id=p_id,
            doctor_id=d_id,
            slot_id=time_slot.id,
            date=data.date,
            start_time=data.start_time,
            reason=data.reason,
        )
        db.add(appointment)
        await db.flush()
        await db.refresh(appointment)

        await db.commit()
        return appointment

    async def get_appointment_by_id(self, db: AsyncSession, appointment_id: str) -> Appointment:
        """Fetch a single appointment."""
        result = await db.execute(
            select(Appointment).where(Appointment.id == appointment_id)
        )
        appointment = result.scalar_one_or_none()
        if not appointment:
            raise NotFoundError("Appointment")
        return appointment

    async def get_patient_appointments(
        self,
        db: AsyncSession,
        patient_id: str,
    ) -> list[Appointment]:
        """Fetch all appointments for a patient (past + future)."""
        result = await db.execute(
            select(Appointment)
            .where(Appointment.patient_id == patient_id)
            .order_by(Appointment.date.desc(), Appointment.start_time.desc())
        )
        return result.scalars().all()

    async def get_doctor_appointments_today(
        self,
        db: AsyncSession,
        doctor_id: str,
        today_only: bool = True,
    ) -> list[Appointment]:
        """Fetch appointments for a doctor (ordered by time)."""
        query = select(Appointment).where(Appointment.doctor_id == doctor_id)
        
        if today_only:
            query = query.where(Appointment.date == date.today())
            query = query.where(
                Appointment.status.notin_(
                    [AppointmentStatus.cancelled, AppointmentStatus.no_show]
                )
            )
            
        query = query.order_by(Appointment.date.desc() if not today_only else Appointment.start_time)
        result = await db.execute(query)
        return result.scalars().all()


    async def get_all_appointments(
        self,
        db: AsyncSession,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[Appointment]:
        """Fetch appointments with optional filters (for admin)."""
        query = select(Appointment)

        if status:
            query = query.where(Appointment.status == AppointmentStatus(status))
        if date_from:
            query = query.where(Appointment.date >= date_from)
        if date_to:
            query = query.where(Appointment.date <= date_to)

        query = query.order_by(Appointment.date.desc(), Appointment.start_time.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def cancel_appointment(
        self,
        db: AsyncSession,
        appointment_id: str,
        patient_id: str,
    ) -> Appointment:
        """Cancel an appointment (patient can only cancel their own)."""
        appointment = await self.get_appointment_by_id(db, appointment_id)

        # Verify ownership
        if appointment.patient_id != patient_id:
            raise ConflictError("You can only cancel your own appointments.")

        # Can't cancel if already done/cancelled
        if appointment.status in [AppointmentStatus.done, AppointmentStatus.cancelled]:
            raise ValidationError(f"Cannot cancel appointment with status '{appointment.status.value}'.")

        appointment.status = AppointmentStatus.cancelled
        await db.commit()
        await db.refresh(appointment)
        return appointment

    async def update_appointment_status(
        self,
        db: AsyncSession,
        appointment_id: str,
        data: AppointmentStatusUpdate,
    ) -> Appointment:
        """Update appointment status (doctor can update their own appointments)."""
        appointment = await self.get_appointment_by_id(db, appointment_id)

        appointment.status = AppointmentStatus(data.status)
        appointment.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(appointment)
        return appointment


appointment_service = AppointmentService()
