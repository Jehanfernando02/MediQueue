import uuid
from datetime import datetime
from sqlalchemy import Text, ForeignKey, DateTime, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ConsultationNote(Base):
    __tablename__ = "consultation_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    appointment: Mapped["Appointment"] = relationship(back_populates="consultation_notes")
    doctor: Mapped["Doctor"] = relationship(back_populates="consultation_notes")

    def __repr__(self) -> str:
        return f"<ConsultationNote id={self.id} appointment_id={self.appointment_id}>"
