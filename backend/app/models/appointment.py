import enum
import uuid
from datetime import date, time, datetime
from sqlalchemy import String, ForeignKey, Enum, Date, Time, DateTime, Integer, Index, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    arrived = "arrived"
    in_progress = "in_progress"
    done = "done"
    cancelled = "cancelled"
    no_show = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # Query optimisation indexes — doctor's daily queue + patient history
        Index("ix_appointments_doctor_date", "doctor_id", "date"),
        Index("ix_appointments_patient_id", "patient_id"),
        Index("ix_appointments_status_date", "status", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    slot_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("time_slots.id", ondelete="SET NULL"), nullable=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.scheduled, nullable=False
    )
    queue_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    doctor: Mapped["Doctor"] = relationship(back_populates="appointments")
    slot: Mapped["TimeSlot"] = relationship(back_populates="appointments")
    consultation_notes: Mapped[list["ConsultationNote"]] = relationship(
        back_populates="appointment", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Appointment id={self.id} patient_id={self.patient_id} "
            f"doctor_id={self.doctor_id} date={self.date} status={self.status}>"
        )
