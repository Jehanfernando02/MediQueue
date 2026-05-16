import uuid
from datetime import time
from sqlalchemy import ForeignKey, Integer, Time, Boolean, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TimeSlot(Base):
    """
    Represents a recurring weekly schedule slot for a doctor.
    day_of_week: 0=Monday … 6=Sunday
    """
    __tablename__ = "time_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-6
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    doctor: Mapped["Doctor"] = relationship(back_populates="time_slots")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="slot")

    def __repr__(self) -> str:
        return (
            f"<TimeSlot id={self.id} doctor_id={self.doctor_id} "
            f"day={self.day_of_week} {self.start_time}-{self.end_time}>"
        )
