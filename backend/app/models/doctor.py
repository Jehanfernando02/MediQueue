import enum
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum, DateTime, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DoctorStatus(str, enum.Enum):
    active = "active"
    on_leave = "on_leave"
    inactive = "inactive"


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[DoctorStatus] = mapped_column(
        Enum(DoctorStatus), default=DoctorStatus.active, nullable=False
    )
    rating: Mapped[float] = mapped_column(default=5.0, nullable=False)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)
    consultation_fee: Mapped[float] = mapped_column(default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="doctor_profile")
    department: Mapped["Department"] = relationship(back_populates="doctors")
    time_slots: Mapped[list["TimeSlot"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")
    consultation_notes: Mapped[list["ConsultationNote"]] = relationship(back_populates="doctor")

    def __repr__(self) -> str:
        return f"<Doctor id={self.id} name={self.name} specialty={self.specialty}>"
