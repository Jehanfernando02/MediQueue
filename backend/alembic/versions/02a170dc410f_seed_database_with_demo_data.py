"""seed_database_with_demo_data

Revision ID: 02a170dc410f
Revises: 3ed2792ce905
Create Date: 2026-05-23 12:37:39.567912

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


# revision identifiers, used by Alembic.
revision: str = '02a170dc410f'
down_revision: Union[str, Sequence[str], None] = '3ed2792ce905'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - seed database with demo data."""
    # Check if data already exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT COUNT(*) FROM users"))
    if result.scalar() > 0:
        return  # Skip if already seeded

    # Insert departments
    cardiology_id = str(uuid.uuid4())
    neurology_id = str(uuid.uuid4())
    orthopedics_id = str(uuid.uuid4())
    pediatrics_id = str(uuid.uuid4())
    dermatology_id = str(uuid.uuid4())

    op.execute(
        f"""
            INSERT INTO departments (id, name, description, created_at)
            VALUES
                ('{cardiology_id}', 'Cardiology', 'Heart and cardiovascular system specialists', NOW()),
                ('{neurology_id}', 'Neurology', 'Brain and nervous system specialists', NOW()),
                ('{orthopedics_id}', 'Orthopedics', 'Musculoskeletal system specialists', NOW()),
                ('{pediatrics_id}', 'Pediatrics', 'Child healthcare specialists', NOW()),
                ('{dermatology_id}', 'Dermatology', 'Skin and hair specialists', NOW())
        """
    )

    # Insert users
    admin_id = str(uuid.uuid4())
    doctor_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    op.execute(
        f"""
            INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
            VALUES
                ('{admin_id}', 'admin@demo.mediqueue.org', '{hash_password("admin123")}', 'admin', true, NOW(), NOW()),
                ('{doctor_id}', 'doctor@demo.mediqueue.org', '{hash_password("doctor123")}', 'doctor', true, NOW(), NOW()),
                ('{patient_id}', 'patient@demo.mediqueue.org', '{hash_password("patient123")}', 'patient', true, NOW(), NOW())
        """
    )

    # Insert doctor profile
    doctor_profile_id = str(uuid.uuid4())
    op.execute(
        f"""
            INSERT INTO doctors (id, user_id, department_id, name, specialty, status, rating, review_count, consultation_fee, created_at)
            VALUES
                ('{doctor_profile_id}', '{doctor_id}', '{cardiology_id}', 'Dr. Sarah Johnson', 'Cardiologist', 'active', 4.8, 120, 150.0, NOW())
        """
    )

    # Insert patient profile
    patient_profile_id = str(uuid.uuid4())
    op.execute(
        f"""
            INSERT INTO patients (id, user_id, name, dob, blood_type, phone, created_at)
            VALUES
                ('{patient_profile_id}', '{patient_id}', 'John Doe', '1990-05-15', 'O+', '+1234567890', NOW())
        """
    )


def downgrade() -> None:
    """Downgrade schema - remove demo data."""
    op.execute(sa.text("DELETE FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.mediqueue.org')"))
    op.execute(sa.text("DELETE FROM doctors WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.mediqueue.org')"))
    op.execute(sa.text("DELETE FROM users WHERE email LIKE '%@demo.mediqueue.org'"))
    op.execute(sa.text("DELETE FROM departments WHERE name IN ('Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology')"))
