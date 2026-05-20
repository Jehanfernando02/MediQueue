import asyncio
from datetime import date, timedelta
from sqlalchemy import select, update
from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models.appointment import Appointment, AppointmentStatus

async def _nightly_no_show_sweep():
    """Mark all past scheduled appointments as no-show."""
    async with AsyncSessionLocal() as db:
        yesterday = date.today() - timedelta(days=1)
        
        # Update all 'scheduled' or 'arrived' appointments from yesterday or earlier to 'no_show'
        await db.execute(
            update(Appointment)
            .where(Appointment.date <= yesterday)
            .where(Appointment.status.in_([AppointmentStatus.scheduled, AppointmentStatus.arrived]))
            .values(status=AppointmentStatus.no_show)
        )
        await db.commit()

@celery_app.task(name="app.tasks.appointment_tasks.nightly_no_show_sweep")
def nightly_no_show_sweep():
    """Celery task wrapper."""
    asyncio.run(_nightly_no_show_sweep())
