from pydantic import BaseModel, Field
from uuid import UUID


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_at: str

    class Config:
        from_attributes = True
