import uuid
from datetime import datetime
from pydantic import BaseModel

from app.schemas.company import CompanyProfileResponse


class CertificateProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    company: CompanyProfileResponse | None = None

    model_config = {"from_attributes": True}


class CertificateResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    student_id: uuid.UUID
    pdf_url: str
    issued_at: datetime
    project: CertificateProjectResponse | None = None

    model_config = {"from_attributes": True}


class CertificateListResponse(BaseModel):
    items: list[CertificateResponse]
    total: int
