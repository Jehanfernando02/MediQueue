from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorSlotItem
from app.utils.exceptions import NotFoundError, ConflictError
from app.utils.hashing import hash_password


class DoctorService:
    """Service for doctor CRUD operations."""

    async def get_all_doctors(self, db: AsyncSession) -> list[Doctor]:
        """Fetch all doctors."""
        result = await db.execute(select(Doctor))
        return result.scalars().all()

    async def get_doctor_by_id(self, db: AsyncSession, doctor_id: str) -> Doctor:
        """Fetch a single doctor."""
        result = await db.execute(
            select(Doctor).where(Doctor.id == doctor_id)
        )
        doctor = result.scalar_one_or_none()
        if not doctor:
            raise NotFoundError("Doctor")
        return doctor

    async def get_doctor_by_user_id(self, db: AsyncSession, user_id: str) -> Doctor:
        """Fetch doctor profile by user ID."""
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == user_id)
        )
        doctor = result.scalar_one_or_none()
        if not doctor:
            raise NotFoundError("Doctor")
        return doctor

    async def generate_default_slots(self, db: AsyncSession, doctor_id: str) -> None:
        """Generate default weekly slots (Mon-Sat, 30-min intervals) for a doctor."""
        from app.models.time_slot import TimeSlot
        from datetime import time
        import uuid

        dr_uuid = uuid.UUID(doctor_id) if isinstance(doctor_id, str) else doctor_id

        default_hours = [
            (time(9, 0), time(9, 30)),
            (time(9, 30), time(10, 0)),
            (time(10, 0), time(10, 30)),
            (time(10, 30), time(11, 0)),
            (time(11, 0), time(11, 30)),
            (time(11, 30), time(12, 0)),
            (time(14, 0), time(14, 30)),
            (time(14, 30), time(15, 0)),
            (time(15, 0), time(15, 30)),
            (time(15, 30), time(16, 0)),
            (time(16, 0), time(16, 30)),
        ]

        # Monday (0) to Saturday (5)
        for day in range(6):
            for start, end in default_hours:
                slot = TimeSlot(
                    doctor_id=dr_uuid,
                    day_of_week=day,
                    start_time=start,
                    end_time=end,
                    is_active=True,
                )
                db.add(slot)

    async def create_doctor(
        self,
        db: AsyncSession,
        data: DoctorCreate,
    ) -> Doctor:
        """Create a new doctor with user account and default schedule slots."""
        # Check duplicate email
        result = await db.execute(
            select(User).where(User.email == data.email)
        )
        if result.scalar_one_or_none():
            raise ConflictError("An account with this email already exists.")

        # Create user account for doctor
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role=UserRole.doctor,
        )
        db.add(user)
        await db.flush()

        # Create doctor profile
        doctor = Doctor(
            user_id=user.id,
            name=data.name,
            specialty=data.specialty,
            department_id=data.department_id,
        )
        db.add(doctor)
        await db.flush()  # flush to generate doctor.id

        # Generate default weekly slots
        await self.generate_default_slots(db, str(doctor.id))

        await db.commit()
        await db.refresh(doctor)
        return doctor

    async def update_doctor(
        self,
        db: AsyncSession,
        doctor_id: str,
        data: DoctorUpdate,
    ) -> Doctor:
        """Update doctor profile."""
        doctor = await self.get_doctor_by_id(db, doctor_id)

        if data.name:
            doctor.name = data.name
        if data.specialty:
            doctor.specialty = data.specialty
        if data.department_id:
            doctor.department_id = data.department_id
        if data.status:
            doctor.status = data.status

        await db.commit()
        await db.refresh(doctor)
        return doctor

    async def delete_doctor(self, db: AsyncSession, doctor_id: str) -> None:
        """Delete a doctor and associated user."""
        doctor = await self.get_doctor_by_id(db, doctor_id)
        # Cascade delete via FK
        await db.delete(doctor)
        await db.commit()

    async def get_available_slots(
        self,
        db: AsyncSession,
        doctor_id: str,
        target_date: date,
    ) -> list[dict]:
        """
        Calculate available time slots for a doctor on a specific date.
        Returns a list of slots from the doctor's weekly template that are not yet booked.
        """
        from app.models.time_slot import TimeSlot
        from app.models.appointment import Appointment, AppointmentStatus

        # 1. Get day of week (0=Monday, 6=Sunday)
        day_of_week = target_date.weekday()

        # 2. Fetch active TimeSlots for this doctor and day
        result = await db.execute(
            select(TimeSlot)
            .where(TimeSlot.doctor_id == doctor_id)
            .where(TimeSlot.day_of_week == day_of_week)
            .where(TimeSlot.is_active == True)
            .order_by(TimeSlot.start_time)
        )
        slots = result.scalars().all()

        # 3. Fetch existing non-cancelled appointments for this doctor and date
        result = await db.execute(
            select(Appointment)
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date == target_date)
            .where(Appointment.status.notin_([AppointmentStatus.cancelled, AppointmentStatus.no_show]))
        )
        booked_appointments = result.scalars().all()
        booked_times = {a.start_time for a in booked_appointments}

        # 4. Filter slots
        available = []
        for s in slots:
            available.append({
                "id": str(s.id),
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "is_available": s.start_time not in booked_times
            })

        return available

    async def get_weekly_schedule(self, db: AsyncSession, doctor_id: str) -> dict:
        """Fetch doctor's weekly availability and appointments."""
        from app.models.time_slot import TimeSlot
        from app.models.appointment import Appointment, AppointmentStatus
        
        today = date.today()
        # Monday of current week
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        
        # 1. Fetch Availability Template
        res = await db.execute(
            select(TimeSlot)
            .where(TimeSlot.doctor_id == doctor_id)
            .where(TimeSlot.is_active == True)
            .order_by(TimeSlot.day_of_week, TimeSlot.start_time)
        )
        slots = res.scalars().all()
        
        # 2. Fetch Appointments for the week
        res = await db.execute(
            select(Appointment)
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.date.between(monday, sunday))
            .where(Appointment.status.notin_([AppointmentStatus.cancelled]))
            .order_by(Appointment.date, Appointment.start_time)
        )
        appointments = res.scalars().all()
        
        # 3. Fetch Patient Names for enrichment
        from app.models.patient import Patient
        patient_ids = [str(a.patient_id) for a in appointments]
        patient_map = {}
        if patient_ids:
            res = await db.execute(select(Patient).where(Patient.id.in_(patient_ids)))
            patient_map = {str(p.id): p.name for p in res.scalars().all()}

        return {
            "range": {"from": monday.isoformat(), "to": sunday.isoformat()},
            "availability": [
                {
                    "day": s.day_of_week,
                    "start": s.start_time.isoformat(),
                    "end": s.end_time.isoformat()
                } for s in slots
            ],
            "appointments": [
                {
                    "id": str(a.id),
                    "date": a.date.isoformat(),
                    "time": a.start_time.isoformat(),
                    "patient_name": patient_map.get(str(a.patient_id), "Unknown"),
                    "status": a.status.value
                } for a in appointments
            ]
        }

    async def update_slots(
        self,
        db: AsyncSession,
        doctor_id: str,
        slots_data: list[DoctorSlotItem],
    ) -> None:
        """Update doctor's weekly slots template by replacing the old ones."""
        from app.models.time_slot import TimeSlot
        import uuid
        from datetime import datetime, timedelta, date

        dr_uuid = uuid.UUID(doctor_id) if isinstance(doctor_id, str) else doctor_id

        # Delete all existing slots for this doctor
        await db.execute(
            delete(TimeSlot).where(TimeSlot.doctor_id == dr_uuid)
        )

        # Add new slots split into 30-minute intervals
        for s in slots_data:
            current_start = datetime.combine(date.today(), s.start_time)
            final_end = datetime.combine(date.today(), s.end_time)

            while current_start < final_end:
                current_end = current_start + timedelta(minutes=30)
                if current_end > final_end:
                    break

                slot = TimeSlot(
                    doctor_id=dr_uuid,
                    day_of_week=s.day_of_week,
                    start_time=current_start.time(),
                    end_time=current_end.time(),
                    is_active=True,
                )
                db.add(slot)
                current_start = current_end

        await db.commit()


doctor_service = DoctorService()
