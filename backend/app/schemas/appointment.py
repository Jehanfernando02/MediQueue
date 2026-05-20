from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date, time, datetime


class AppointmentCreate(BaseModel):
    doctor_id: UUID
    slot_id: UUID | None = None
    date: date
    start_time: time
    reason: str | None = Field(None, max_length=500)


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(scheduled|arrived|in_progress|done|cancelled|no_show)$")


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    slot_id: UUID | None
    date: date
    start_time: time
    status: str
    queue_number: int | None
    reason: str | None
    notes_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentDetailResponse(AppointmentResponse):
    patient_name: str | None = None
    doctor_name: str | None = None
    doctor_specialty: str | None = None


class QueuePositionResponse(BaseModel):
    position: int
    ahead: int
    eta_minutes: int
    total_in_queue: int


class DoctorQueueStatsResponse(BaseModel):
    total: int
    completed: int
    in_progress: int
    remaining: int
    avg_time_per_patient: int
