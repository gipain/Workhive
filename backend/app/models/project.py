import uuid
import enum
from datetime import datetime

from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(5000), nullable=False)
    requirements: Mapped[str | None] = mapped_column(String(5000), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(SAEnum(ProjectStatus, name="project_status"), default=ProjectStatus.open)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_applicants: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company: Mapped["CompanyProfile"] = relationship(back_populates="projects")
    skills: Mapped[list["Skill"]] = relationship(secondary="project_skills", back_populates="projects")
    applications: Mapped[list["Application"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    invitations: Mapped[list["Invitation"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="project", cascade="all, delete-orphan")


from app.models.user import CompanyProfile
from app.models.skill import Skill
from app.models.application import Application
from app.models.invitation import Invitation
from app.models.submission import Submission
from app.models.review import Review
from app.models.certificate import Certificate
