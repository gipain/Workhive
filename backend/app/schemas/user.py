import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    is_active: bool


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class UserWithProfile(UserResponse):
    student_profile: "StudentProfileResponse | None" = None
    company_profile: "CompanyProfileResponse | None" = None


from app.schemas.student import StudentProfileResponse
from app.schemas.company import CompanyProfileResponse

UserWithProfile.model_rebuild()
