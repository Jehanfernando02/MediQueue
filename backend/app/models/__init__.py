# models/__init__.py
# Import all models here so Alembic autogenerate can detect them all
from app.models.user import User  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.time_slot import TimeSlot  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.consultation_note import ConsultationNote  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
