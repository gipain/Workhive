import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CompanyProfileUpdate(BaseModel):
    company_name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    website: str | None = Field(None, max_length=500)
    logo_url: str | None = Field(None, max_length=500)
    industry: str | None = Field(None, max_length=100)


class CompanyProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str
    description: str | None = None
    website: str | None = None
    logo_url: str | None = None
    industry: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyListResponse(BaseModel):
    items: list[CompanyProfileResponse]
    total: int
    page: int
    size: int
