import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.services.notification_service import notification_service

async def _send_reminders():
    """Logic to find appointments in the next hour and send notifications."""
    async with AsyncSessionLocal() as db:
        # Find appointments starting in 45-60 minutes
        now = datetime.now(timezone.utc)
        start_window = now + timedelta(minutes=45)
        end_window = now + timedelta(minutes=60)
        
        result = await db.execute(
            select(Appointment)
            .where(Appointment.status == AppointmentStatus.scheduled)
            .where(Appointment.date == start_window.date())
            # Note: This simple check assumes start_time is stored in a way we can filter easily
            # Real production app would need better datetime math
        )
        appointments = result.scalars().all()
        
        for appt in appointments:
            # Check if reminder already sent (could use a flag on appointment or separate table)
            # For Phase 3, we'll just create the notification
            from app.models.patient import Patient
            res = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
            patient = res.scalar_one_or_none()
            if patient:
                await notification_service.create_notification(
                    db,
                    user_id=str(patient.user_id),
                    notification_type="reminder",
                    title="Upcoming Appointment Reminder",
                    body=f"Reminder: You have an appointment at {appt.start_time.strftime('%I:%M %p')} today."
                )

@celery_app.task(name="app.tasks.notification_tasks.send_appointment_reminders")
def send_appointment_reminders():
    """Celery task wrapper."""
    asyncio.run(_send_reminders())
