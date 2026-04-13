import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class SkillResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class StudentProfileBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=2000)
    university: str | None = Field(None, max_length=255)
    graduation_year: int | None = None
    phone: str | None = Field(None, max_length=20)


class StudentProfileUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=2000)
    university: str | None = Field(None, max_length=255)
    graduation_year: int | None = None
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=500)
    resume_url: str | None = Field(None, max_length=500)
    skill_names: list[str] | None = None


class StudentProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    first_name: str
    last_name: str
    bio: str | None = None
    university: str | None = None
    graduation_year: int | None = None
    avatar_url: str | None = None
    resume_url: str | None = None
    phone: str | None = None
    rating_avg: float
    total_completed: int
    skills: list[SkillResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    items: list[StudentProfileResponse]
    total: int
    page: int
    size: int
