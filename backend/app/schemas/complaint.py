import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    target_user_id: uuid.UUID
    reason: str = Field(..., min_length=10, max_length=2000)


class ComplaintUpdate(BaseModel):
    status: str = Field(..., pattern="^(resolved|dismissed)$")
    admin_notes: str | None = Field(None, max_length=2000)


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    target_user_id: uuid.UUID
    reason: str
    status: str
    admin_notes: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    items: list[ComplaintResponse]
    total: int
    page: int
    size: int
