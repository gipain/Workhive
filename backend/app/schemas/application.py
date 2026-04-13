import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.student import StudentProfileResponse


class ApplicationCreate(BaseModel):
    cover_letter: str | None = Field(None, max_length=3000)


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected)$")


class ApplicationProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: str
    deadline: datetime | None = None

    model_config = {"from_attributes": True}


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    student_id: uuid.UUID
    status: str
    cover_letter: str | None = None
    student: StudentProfileResponse | None = None
    project: ApplicationProjectResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
    page: int
    size: int
