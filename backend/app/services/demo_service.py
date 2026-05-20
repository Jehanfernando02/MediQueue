import uuid
from datetime import date, time, datetime, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor, DoctorStatus
from app.models.department import Department
from app.models.time_slot import TimeSlot
from app.models.appointment import Appointment, AppointmentStatus
from app.models.consultation_note import ConsultationNote
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.utils.hashing import hash_password


class DemoService:
    """Service to wipe and seed the database with premium, realistic clinical showcase data."""

    async def seed_sandbox_data(self, db: AsyncSession) -> None:
        # 1. Truncate all tables to start completely fresh
        await db.execute(
            text(
                "TRUNCATE TABLE users, patients, departments, doctors, "
                "time_slots, appointments, consultation_notes, notifications, "
                "audit_logs RESTART IDENTITY CASCADE;"
            )
        )
        await db.flush()

        # 2. Seed Departments
        dept_cardio = Department(
            id=uuid.uuid4(),
            name="Cardiology",
            description="Comprehensive cardiovascular diagnostics and heart care.",
        )
        dept_peds = Department(
            id=uuid.uuid4(),
            name="Pediatrics",
            description="General medicine and clinical checkups for children.",
        )
        dept_derm = Department(
            id=uuid.uuid4(),
            name="Dermatology",
            description="Skin, hair, nail clinical assessments and therapies.",
        )
        dept_gp = Department(
            id=uuid.uuid4(),
            name="General Medicine",
            description="Primary healthcare, physical wellness, and prevention.",
        )
        db.add_all([dept_cardio, dept_peds, dept_derm, dept_gp])
        await db.flush()

        # Common password for all demo accounts to keep it simple
        shared_password_hash = hash_password("demopassword")

        # 3. Seed Users
        # Admin
        u_admin = User(
            id=uuid.uuid4(),
            email="admin@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.admin,
        )
        # Primary Demo Doctor (Dr. Allison Vance)
        u_doc_vance = User(
            id=uuid.uuid4(),
            email="doctor@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.doctor,
        )
        # Other Doctors
        u_doc_brody = User(
            id=uuid.uuid4(),
            email="marcus.brody@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.doctor,
        )
        u_doc_halloway = User(
            id=uuid.uuid4(),
            email="elena.halloway@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.doctor,
        )
        u_doc_jenkins = User(
            id=uuid.uuid4(),
            email="sarah.jenkins@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.doctor,
        )

        # Primary Demo Patient (John Doe)
        u_pat_doe = User(
            id=uuid.uuid4(),
            email="patient@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.patient,
        )
        # Other Patients
        u_pat_connor = User(
            id=uuid.uuid4(),
            email="patient2@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.patient,
        )
        u_pat_wayne = User(
            id=uuid.uuid4(),
            email="patient3@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.patient,
        )
        u_pat_parker = User(
            id=uuid.uuid4(),
            email="patient4@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.patient,
        )
        u_pat_prince = User(
            id=uuid.uuid4(),
            email="patient5@demo.mediqueue.org",
            password_hash=shared_password_hash,
            role=UserRole.patient,
        )

        db.add_all([
            u_admin, u_doc_vance, u_doc_brody, u_doc_halloway, u_doc_jenkins,
            u_pat_doe, u_pat_connor, u_pat_wayne, u_pat_parker, u_pat_prince
        ])
        await db.flush()

        # 4. Seed Doctors Profiles
        p_doc_vance = Doctor(
            id=uuid.uuid4(),
            user_id=u_doc_vance.id,
            department_id=dept_cardio.id,
            name="Dr. Allison Vance",
            specialty="Cardiology",
            status=DoctorStatus.active,
            rating=4.9,
            review_count=142,
            consultation_fee=150.0,
        )
        p_doc_brody = Doctor(
            id=uuid.uuid4(),
            user_id=u_doc_brody.id,
            department_id=dept_peds.id,
            name="Dr. Marcus Brody",
            specialty="Pediatrics",
            status=DoctorStatus.active,
            rating=4.8,
            review_count=98,
            consultation_fee=120.0,
        )
        p_doc_halloway = Doctor(
            id=uuid.uuid4(),
            user_id=u_doc_halloway.id,
            department_id=dept_derm.id,
            name="Dr. Elena Halloway",
            specialty="Dermatology",
            status=DoctorStatus.active,
            rating=4.9,
            review_count=115,
            consultation_fee=135.0,
        )
        p_doc_jenkins = Doctor(
            id=uuid.uuid4(),
            user_id=u_doc_jenkins.id,
            department_id=dept_gp.id,
            name="Dr. Sarah Jenkins",
            specialty="General Medicine",
            status=DoctorStatus.active,
            rating=4.7,
            review_count=84,
            consultation_fee=95.0,
        )

        db.add_all([p_doc_vance, p_doc_brody, p_doc_halloway, p_doc_jenkins])
        await db.flush()

        # 5. Seed Patients Profiles
        p_pat_doe = Patient(
            id=uuid.uuid4(),
            user_id=u_pat_doe.id,
            name="John Doe",
            dob=date(1990, 5, 15),
            blood_type="O+",
            phone="+1 (555) 123-4567",
        )
        p_pat_connor = Patient(
            id=uuid.uuid4(),
            user_id=u_pat_connor.id,
            name="Sarah Connor",
            dob=date(1985, 11, 10),
            blood_type="A-",
            phone="+1 (555) 987-6543",
        )
        p_pat_wayne = Patient(
            id=uuid.uuid4(),
            user_id=u_pat_wayne.id,
            name="Bruce Wayne",
            dob=date(1982, 2, 19),
            blood_type="AB+",
            phone="+1 (555) 777-8888",
        )
        p_pat_parker = Patient(
            id=uuid.uuid4(),
            user_id=u_pat_parker.id,
            name="Peter Parker",
            dob=date(2001, 8, 10),
            blood_type="O-",
            phone="+1 (555) 321-7654",
        )
        p_pat_prince = Patient(
            id=uuid.uuid4(),
            user_id=u_pat_prince.id,
            name="Diana Prince",
            dob=date(1975, 4, 30),
            blood_type="B+",
            phone="+1 (555) 999-0000",
        )

        db.add_all([p_pat_doe, p_pat_connor, p_pat_wayne, p_pat_parker, p_pat_prince])
        await db.flush()

        # 6. Seed Time Slots for Dr. Vance (Primary) and others
        # We need recurring weekly schedules (0=Monday ... 6=Sunday).
        # Let's seed slots for the active demo doctor Dr. Vance for today's day of week.
        today_day = date.today().weekday()
        
        # We seed slots for ALL days of the week so the templates are fully complete.
        time_templates = [
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

        active_slots_today = []
        for d_id in [p_doc_vance.id, p_doc_brody.id, p_doc_halloway.id, p_doc_jenkins.id]:
            for day in range(7):  # Mon-Sun
                for start_t, end_t in time_templates:
                    ts = TimeSlot(
                        id=uuid.uuid4(),
                        doctor_id=d_id,
                        day_of_week=day,
                        start_time=start_t,
                        end_time=end_t,
                        is_active=True,
                    )
                    db.add(ts)
                    if d_id == p_doc_vance.id and day == today_day:
                        active_slots_today.append(ts)
        
        await db.flush()

        # Sort slots by start_time to easily map today's appointments
        active_slots_today.sort(key=lambda s: s.start_time)

        # 7. Seed Today's Queue Appointments (Primary Doctor: Dr. Allison Vance)
        today = date.today()

        # 9:00 AM Appointment - Completed (Bruce Wayne)
        ap_wayne = Appointment(
            id=uuid.uuid4(),
            patient_id=p_pat_wayne.id,
            doctor_id=p_doc_vance.id,
            slot_id=active_slots_today[0].id,
            date=today,
            start_time=time(9, 0),
            status=AppointmentStatus.done,
            queue_number=1,
            reason="Cardiovascular stress review",
            notes_count=1,
        )
        # 9:30 AM Appointment - In Progress (Sarah Connor)
        ap_connor = Appointment(
            id=uuid.uuid4(),
            patient_id=p_pat_connor.id,
            doctor_id=p_doc_vance.id,
            slot_id=active_slots_today[1].id,
            date=today,
            start_time=time(9, 30),
            status=AppointmentStatus.in_progress,
            queue_number=2,
            reason="Post-operation blood pressure audit",
            notes_count=0,
        )
        # 10:00 AM Appointment - Arrived / Waiting (Diana Prince)
        ap_prince = Appointment(
            id=uuid.uuid4(),
            patient_id=p_pat_prince.id,
            doctor_id=p_doc_vance.id,
            slot_id=active_slots_today[2].id,
            date=today,
            start_time=time(10, 0),
            status=AppointmentStatus.arrived,
            queue_number=3,
            reason="Heart rhythm analysis",
            notes_count=0,
        )
        # 10:30 AM Appointment - Scheduled (John Doe - Main Patient)
        ap_doe = Appointment(
            id=uuid.uuid4(),
            patient_id=p_pat_doe.id,
            doctor_id=p_doc_vance.id,
            slot_id=active_slots_today[3].id,
            date=today,
            start_time=time(10, 30),
            status=AppointmentStatus.scheduled,
            queue_number=4,
            reason="Post-treatment heart checkup",
            notes_count=0,
        )
        # 11:00 AM Appointment - Scheduled (Peter Parker)
        ap_parker = Appointment(
            id=uuid.uuid4(),
            patient_id=p_pat_parker.id,
            doctor_id=p_doc_vance.id,
            slot_id=active_slots_today[4].id,
            date=today,
            start_time=time(11, 0),
            status=AppointmentStatus.scheduled,
            queue_number=5,
            reason="High pulse checkup",
            notes_count=0,
        )

        db.add_all([ap_wayne, ap_connor, ap_prince, ap_doe, ap_parker])
        await db.flush()

        # 8. Seed Consultation Note for Completed Appointment
        note_wayne = ConsultationNote(
            id=uuid.uuid4(),
            appointment_id=ap_wayne.id,
            doctor_id=p_doc_vance.id,
            content=(
                "Patient Bruce Wayne reports minor chest tightness during high-exertion evening activities. "
                "EKG check shows clean sinus rhythm with trace sinus arrhythmia during rest. "
                "Echocardiogram demonstrates strong ejection fraction (62%). "
                "Diagnosis: Normal recovery post-stress event. "
                "Recommendation: Reduce strenuous activity during late night hours, keep stress levels in check, "
                "and follow up in 90 days."
            ),
        )
        db.add(note_wayne)
        await db.flush()

        # 9. Seed Notifications for Main Patient (John Doe)
        n1 = Notification(
            id=uuid.uuid4(),
            user_id=u_pat_doe.id,
            type="appointment_confirmed",
            title="Appointment Confirmed",
            body="Your appointment with Dr. Allison Vance is scheduled for today at 10:30 AM.",
            is_read=False,
        )
        n2 = Notification(
            id=uuid.uuid4(),
            user_id=u_pat_doe.id,
            type="report_uploaded",
            title="Cardiology Report Uploaded",
            body="Dr. Allison Vance uploaded your heart stress test report.",
            is_read=True,
        )
        n3 = Notification(
            id=uuid.uuid4(),
            user_id=u_pat_doe.id,
            type="system",
            title="Welcome to MediQueue",
            body="Welcome to the clinical OS. Keep track of your queue status live in real-time.",
            is_read=True,
        )
        db.add_all([n1, n2, n3])
        await db.flush()

        # 10. Seed Audit Logs showing rich compliance events (INSERT-ONLY)
        logs = [
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_admin.id,
                action="Admin created department **Cardiology**",
                entity="Department",
                entity_id=str(dept_cardio.id),
                ip_address="127.0.0.1",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_admin.id,
                action="Admin created department **Pediatrics**",
                entity="Department",
                entity_id=str(dept_peds.id),
                ip_address="127.0.0.1",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_admin.id,
                action="Admin registered **Dr. Allison Vance** in Cardiology",
                entity="Doctor",
                entity_id=str(p_doc_vance.id),
                ip_address="127.0.0.1",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_admin.id,
                action="Admin configured weekly schedule template for **Dr. Allison Vance**",
                entity="Schedule",
                entity_id=str(p_doc_vance.id),
                ip_address="127.0.0.1",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_pat_doe.id,
                action="Patient **John Doe** registered profile successfully",
                entity="Patient",
                entity_id=str(p_pat_doe.id),
                ip_address="192.168.1.102",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_pat_connor.id,
                action="Patient **Sarah Connor** registered profile successfully",
                entity="Patient",
                entity_id=str(p_pat_connor.id),
                ip_address="192.168.1.103",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_pat_doe.id,
                action="Patient **John Doe** booked slot today at **10:30 AM** with **Dr. Allison Vance**",
                entity="Appointment",
                entity_id=str(ap_doe.id),
                ip_address="192.168.1.102",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_doc_vance.id,
                action="**Dr. Allison Vance** updated consultation note for **Bruce Wayne**",
                entity="Consultation",
                entity_id=str(note_wayne.id),
                ip_address="10.0.2.15",
            ),
            AuditLog(
                id=uuid.uuid4(),
                user_id=u_doc_vance.id,
                action="**Dr. Allison Vance** updated queue status of **Sarah Connor** to **IN_PROGRESS**",
                entity="Appointment",
                entity_id=str(ap_connor.id),
                ip_address="10.0.2.15",
            ),
        ]
        
        db.add_all(logs)
        await db.commit()


demo_service = DemoService()
