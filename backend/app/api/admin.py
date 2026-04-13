import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import func as sa_func
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.user import User, UserRole, StudentProfile, CompanyProfile
from app.models.project import Project
from app.models.complaint import Complaint, ComplaintStatus
from app.models.notification import Notification
from app.schemas.user import UserResponse, UserWithProfile
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintResponse, ComplaintListResponse

router = APIRouter(prefix="/admin", tags=["Адміністрування"])


def _require_admin(user: User):
    if user.role != UserRole.admin:
        raise ForbiddenError("Доступ лише для адміністраторів")


@router.get("/users")
def list_users(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
):
    _require_admin(current_user)

    query = db.query(User)
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "items": [UserWithProfile.model_validate(u) for u in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: uuid.UUID, current_user: CurrentUser, db: DB):
    _require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Користувача не знайдено")
    if user.id == current_user.id:
        raise ForbiddenError("Не можна деактивувати самого себе")

    user.is_active = not user.is_active
    db.commit()

    status = "активовано" if user.is_active else "деактивовано"
    return {"message": f"Акаунт {status}", "is_active": user.is_active}


@router.get("/stats")
def get_stats(current_user: CurrentUser, db: DB):
    _require_admin(current_user)

    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == UserRole.student).count()
    total_companies = db.query(User).filter(User.role == UserRole.company).count()
    total_projects = db.query(Project).count()
    from app.models.project import ProjectStatus
    completed_projects = db.query(Project).filter(Project.status == ProjectStatus.completed).count()
    open_projects = db.query(Project).filter(Project.status == ProjectStatus.open).count()
    from app.models.application import Application
    total_applications = db.query(Application).count()
    total_complaints = db.query(Complaint).count()
    pending_complaints = db.query(Complaint).filter(Complaint.status == ComplaintStatus.open).count()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_companies": total_companies,
        "total_projects": total_projects,
        "completed_projects": completed_projects,
        "open_projects": open_projects,
        "total_applications": total_applications,
        "total_complaints": total_complaints,
        "pending_complaints": pending_complaints,
    }


@router.post("/complaints", response_model=ComplaintResponse, status_code=201)
def create_complaint(data: ComplaintCreate, current_user: CurrentUser, db: DB):
    target = db.query(User).filter(User.id == data.target_user_id).first()
    if not target:
        raise NotFoundError("Користувача не знайдено")

    complaint = Complaint(
        reporter_id=current_user.id,
        target_user_id=data.target_user_id,
        reason=data.reason,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/complaints", response_model=ComplaintListResponse)
def list_complaints(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
):
    _require_admin(current_user)

    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)

    total = query.count()
    items = query.order_by(Complaint.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return ComplaintListResponse(items=items, total=total, page=page, size=size)


@router.patch("/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(complaint_id: uuid.UUID, data: ComplaintUpdate, current_user: CurrentUser, db: DB):
    _require_admin(current_user)

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise NotFoundError("Скаргу не знайдено")

    complaint.status = ComplaintStatus(data.status)
    complaint.admin_notes = data.admin_notes
    if data.status in ("resolved", "dismissed"):
        complaint.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(complaint)
    return complaint
