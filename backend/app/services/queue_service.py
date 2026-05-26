from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.utils.exceptions import NotFoundError

AVG_CONSULT_MINUTES = 15  # Average consultation time per patient


class QueueService:
    """Service for calculating queue positions and managing patient flow."""

    async def calculate_patient_position(
        self,
        db: AsyncSession,
        patient_id: str,
        doctor_id: str,
        appointment_date: date,
    ) -> dict:
        """
        Calculate queue position for a patient on a specific date with a doctor.
        Accounts for cancellations, no-shows, and in-progress appointments.
        """
        from sqlalchemy import select

        # Fetch all appointments for doctor on that date (active status)
        result = await db.execute(
            select(Appointment)
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date == appointment_date)
            .where(
                Appointment.status.notin_(
                    [AppointmentStatus.cancelled, AppointmentStatus.no_show]
                )
            )
            .order_by(Appointment.start_time)
        )
        appointments = result.scalars().all()

        # Find patient's position
        position = None
        for idx, appt in enumerate(appointments):
            if appt.patient_id == patient_id:
                position = idx + 1
                break

        if position is None:
            raise NotFoundError("Appointment not found for this patient on this date.")

        # Calculate ahead count (exclude done appointments)
        ahead = sum(
            1
            for appt in appointments[:position - 1]
            if appt.status not in [AppointmentStatus.done]
        )

        # Estimate ETA
        eta_minutes = ahead * AVG_CONSULT_MINUTES

        return {
            "position": position,
            "ahead": ahead,
            "eta_minutes": eta_minutes,
            "total_in_queue": len(appointments),
        }

    async def get_doctor_queue_today(
        self,
        db: AsyncSession,
        doctor_id: str,
    ) -> dict:
        """Get queue statistics for doctor today (with 20s Redis cache)."""
        from sqlalchemy import select, func
        import app.redis_client
        from app.redis_client import redis_client
        import json
        import logging

        logger = logging.getLogger(__name__)
        cache_key = f"queue:stats:{doctor_id}"
        cached = None
        
        # Try cache
        if app.redis_client.redis_available:
            try:
                cached = await redis_client.get(cache_key)
            except Exception as e:
                logger.warning(f"Redis cache read failed: {e}. Bypassing cache and disabling Redis.")
                app.redis_client.redis_available = False

        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass

        today = date.today()

        # Total appointments today
        result = await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date == today)
            .where(
                Appointment.status.notin_(
                    [AppointmentStatus.cancelled, AppointmentStatus.no_show]
                )
            )
        )
        total = result.scalar() or 0

        # Done appointments
        result = await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date == today)
            .where(Appointment.status == AppointmentStatus.done)
        )
        completed = result.scalar() or 0

        # In progress
        result = await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date == today)
            .where(Appointment.status == AppointmentStatus.in_progress)
        )
        in_progress = result.scalar() or 0

        remaining = total - completed

        stats = {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "remaining": remaining,
            "avg_time_per_patient": AVG_CONSULT_MINUTES,
        }

        # Cache for 20 seconds (short enough for near real-time, long enough to skip 30s poll bursts)
        if app.redis_client.redis_available:
            try:
                await redis_client.setex(cache_key, 20, json.dumps(stats))
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}. Disabling Redis.")
                app.redis_client.redis_available = False

        return stats



queue_service = QueueService()
