from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.department import Department

class AnalyticsService:
    """Service for system-wide analytics and reports."""

    async def get_system_overview(self, db: AsyncSession) -> dict:
        """Fetch high-level system statistics."""
        today = date.today()
        
        # Patients today
        res = await db.execute(select(func.count(Appointment.id)).where(Appointment.date == today))
        patients_today = res.scalar() or 0
        
        # Total active doctors
        res = await db.execute(select(func.count(Doctor.id)).where(Doctor.status == "active"))
        active_doctors = res.scalar() or 0
        
        # Appointments by status (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        res = await db.execute(
            select(Appointment.status, func.count(Appointment.id))
            .where(Appointment.date >= thirty_days_ago)
            .group_by(Appointment.status)
        )
        status_counts = {status.value: count for status, count in res.all()}
        
        return {
            "patients_today": patients_today,
            "active_doctors": active_doctors,
            "status_summary": status_counts,
            "system_health": "Optimal" if active_doctors > 0 else "Degraded"
        }

    async def get_department_load(self, db: AsyncSession) -> list[dict]:
        """Calculate appointment load per department."""
        # This requires joining Appointment -> Doctor -> Department
        query = (
            select(Department.name, func.count(Appointment.id))
            .join(Doctor, Doctor.department_id == Department.id)
            .join(Appointment, Appointment.doctor_id == Doctor.id)
            .group_by(Department.name)
        )
        res = await db.execute(query)
        return [{"department": name, "count": count} for name, count in res.all()]

    async def get_historical_trends(self, db: AsyncSession) -> list[dict]:
        """Fetch appointment counts for the last 6 months."""
        today = date.today()
        six_months_ago = today - timedelta(days=180)
        
        # Group by month and year
        # PostgreSQL specific date_trunc if needed, but here we can use func.extract
        query = (
            select(
                func.extract('year', Appointment.date).label('year'),
                func.extract('month', Appointment.date).label('month'),
                func.count(Appointment.id).label('count')
            )
            .where(Appointment.date >= six_months_ago)
            .group_by('year', 'month')
            .order_by('year', 'month')
        )
        res = await db.execute(query)
        
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        return [
            {
                "month": f"{month_names[int(r.month)-1]} {int(r.year)}",
                "visits": r.count,
                # Random load for visualization as requested in plan
                "load": int(r.count * 0.8)
            }
            for r in res.all()
        ]

    async def export_appointments_csv(self, db: AsyncSession, date_from: date = None, date_to: date = None) -> str:
        """Generate a CSV string of appointments."""
        from app.models.patient import Patient
        from sqlalchemy.orm import selectinload
        import csv
        import io

        query = select(Appointment).options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient)
        )
        
        if date_from:
            query = query.where(Appointment.date >= date_from)
        if date_to:
            query = query.where(Appointment.date <= date_to)
            
        query = query.order_by(Appointment.date.desc(), Appointment.start_time.desc())
        res = await db.execute(query)
        appointments = res.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Date", "Time", "Patient", "Doctor", "Status", "Reason"])
        
        for a in appointments:
            writer.writerow([
                str(a.id),
                a.date.isoformat(),
                a.start_time.isoformat(),
                a.patient.name if a.patient else "N/A",
                a.doctor.name if a.doctor else "N/A",
                a.status.value,
                a.reason or ""
            ])
            
        return output.getvalue()


analytics_service = AnalyticsService()
