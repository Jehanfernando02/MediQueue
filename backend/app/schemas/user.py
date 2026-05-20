import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    dob: str | None = None
    blood_type: str | None = None
    phone: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
