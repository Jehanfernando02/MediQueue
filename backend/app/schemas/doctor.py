from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime


class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    specialty: str = Field(..., min_length=1, max_length=100)
    department_id: UUID | None = None


class DoctorUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    specialty: str | None = Field(None, min_length=1, max_length=100)
    department_id: UUID | None = None
    status: str | None = Field(None, pattern="^(active|on_leave|inactive)$")


class DoctorResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    specialty: str
    department_id: UUID | None
    status: str
    rating: float
    review_count: int
    consultation_fee: float
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorDetailResponse(DoctorResponse):
    email: str | None = None  # If user data is joined
    department_name: str | None = None  # If department data is joined
