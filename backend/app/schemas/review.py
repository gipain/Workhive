import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=3000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    student_id: uuid.UUID
    company_id: uuid.UUID
    rating: int
    comment: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    size: int
