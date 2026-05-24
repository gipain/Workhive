import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.student import SkillResponse
from app.schemas.company import CompanyProfileResponse


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    requirements: str | None = Field(None, max_length=5000)
    deadline: datetime | None = None
    max_applicants: int = Field(1, ge=1, le=50)
    skill_names: list[str] = []
    is_draft: bool = False


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = Field(None, min_length=10, max_length=5000)
    requirements: str | None = Field(None, max_length=5000)
    deadline: datetime | None = None
    max_applicants: int | None = Field(None, ge=1, le=50)
    skill_names: list[str] | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    description: str
    requirements: str | None = None
    status: str
    deadline: datetime | None = None
    max_applicants: int
    is_draft: bool = False
    skills: list[SkillResponse] = []
    company: CompanyProfileResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    size: int
