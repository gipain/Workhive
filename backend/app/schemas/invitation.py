import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.company import CompanyProfileResponse


class InvitationCreate(BaseModel):
    project_id: uuid.UUID
    student_id: uuid.UUID
    message: str | None = Field(None, max_length=2000)


class InvitationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|declined)$")


class InvitationProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: str
    deadline: datetime | None = None

    model_config = {"from_attributes": True}


class InvitationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    student_id: uuid.UUID
    company_id: uuid.UUID
    status: str
    message: str | None = None
    project: InvitationProjectResponse | None = None
    company: CompanyProfileResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvitationListResponse(BaseModel):
    items: list[InvitationResponse]
    total: int
    page: int
    size: int
