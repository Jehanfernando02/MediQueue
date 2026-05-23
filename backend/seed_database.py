"""
Database seeding script.
Run this to populate the database with initial demo data.
"""
import asyncio
import sys
import uuid
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, "/Users/jehanfernando/Desktop/Projects/MediQueue/backend")

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import engine, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.doctor import Doctor, DoctorStatus
from app.models.patient import Patient
from app.utils.hashing import hash_password


async def seed_database():
    """Seed the database with initial demo data."""
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # Create departments
        departments = [
            Department(
                name="Cardiology",
                description="Heart and cardiovascular system specialists"
            ),
            Department(
                name="Neurology",
                description="Brain and nervous system specialists"
            ),
            Department(
                name="Orthopedics",
                description="Musculoskeletal system specialists"
            ),
            Department(
                name="Pediatrics",
                description="Child healthcare specialists"
            ),
            Department(
                name="Dermatology",
                description="Skin and hair specialists"
            ),
        ]
        db.add_all(departments)
        await db.flush()

        # Get department IDs
        cardiology = departments[0].id
        neurology = departments[1].id

        # Create demo users
        # Admin user
        admin_user = User(
            email="admin@demo.mediqueue.org",
            password_hash=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin_user)
        await db.flush()

        # Doctor user
        doctor_user = User(
            email="doctor@demo.mediqueue.org",
            password_hash=hash_password("doctor123"),
            role=UserRole.doctor,
            is_active=True,
        )
        db.add(doctor_user)
        await db.flush()

        # Patient user
        patient_user = User(
            email="patient@demo.mediqueue.org",
            password_hash=hash_password("patient123"),
            role=UserRole.patient,
            is_active=True,
        )
        db.add(patient_user)
        await db.flush()

        # Create doctor profile
        doctor_profile = Doctor(
            user_id=doctor_user.id,
            department_id=cardiology,
            name="Dr. Sarah Johnson",
            specialty="Cardiologist",
            status=DoctorStatus.active,
            rating=4.8,
            review_count=120,
            consultation_fee=150.0,
        )
        db.add(doctor_profile)

        # Create patient profile
        patient_profile = Patient(
            user_id=patient_user.id,
            name="John Doe",
            dob=datetime(1990, 5, 15).date(),
            blood_type="O+",
            phone="+1234567890",
        )
        db.add(patient_profile)

        await db.commit()
        print("Database seeded successfully!")
        print("\nDemo credentials:")
        print("Admin: admin@demo.mediqueue.org / admin123")
        print("Doctor: doctor@demo.mediqueue.org / doctor123")
        print("Patient: patient@demo.mediqueue.org / patient123")


async def main():
    """Main entry point."""
    try:
        await seed_database()
    except Exception as e:
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
