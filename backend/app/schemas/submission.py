import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.student import StudentProfileResponse


class SubmissionCreate(BaseModel):
    comment: str | None = Field(None, max_length=3000)
    file_url: str | None = Field(None, max_length=500)
    link_url: str | None = Field(None, max_length=500)


class SubmissionReview(BaseModel):
    status: str = Field(..., pattern="^(approved|changes_requested)$")
    reviewer_comment: str | None = Field(None, max_length=3000, alias="feedback")

    model_config = {"populate_by_name": True}


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    student_id: uuid.UUID
    comment: str | None = None
    file_url: str | None = None
    link_url: str | None = None
    status: str
    reviewer_comment: str | None = None
    student: StudentProfileResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionListResponse(BaseModel):
    items: list[SubmissionResponse]
    total: int
    page: int
    size: int
