import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError, ConflictError
from app.models.user import UserRole, StudentProfile
from app.models.project import Project, ProjectStatus
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.schemas.application import (
    ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse, ApplicationListResponse,
)

router = APIRouter(tags=["Заявки"])


@router.post("/projects/{project_id}/applications", response_model=ApplicationResponse, status_code=201)
def apply_to_project(project_id: uuid.UUID, data: ApplicationCreate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.student:
        raise ForbiddenError("Тільки студенти можуть подавати заявки")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")
    if project.status != ProjectStatus.open:
        raise BadRequestError("Проєкт не приймає заявки")

    student = current_user.student_profile
    existing = (
        db.query(Application)
        .filter(Application.project_id == project_id, Application.student_id == student.id)
        .first()
    )
    if existing:
        raise ConflictError("Ви вже подали заявку на цей проєкт")

    active_count = (
        db.query(Application)
        .filter(Application.student_id == student.id, Application.status == ApplicationStatus.pending)
        .count()
    )
    if active_count >= 5:
        raise BadRequestError("Максимум 5 активних заявок одночасно")

    application = Application(
        project_id=project_id,
        student_id=student.id,
        cover_letter=data.cover_letter,
    )
    db.add(application)

    notification = Notification(
        user_id=project.company.user_id,
        type="application_received",
        title="Нова заявка",
        message=f"{student.first_name} {student.last_name} подав заявку на проєкт «{project.title}»",
        metadata_json={"project_id": str(project_id), "application_id": str(application.id)},
    )
    db.add(notification)

    db.commit()
    db.refresh(application)
    # Re-load with project for response
    application = (
        db.query(Application)
        .options(joinedload(Application.project), joinedload(Application.student))
        .filter(Application.id == application.id)
        .first()
    )
    return application


@router.get("/projects/{project_id}/applications", response_model=ApplicationListResponse)
def list_project_applications(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role == UserRole.company:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Доступ лише власнику проєкту")
    elif current_user.role != UserRole.admin:
        raise ForbiddenError("Недостатньо прав")

    query = (
        db.query(Application)
        .options(joinedload(Application.student).joinedload(StudentProfile.skills))
        .filter(Application.project_id == project_id)
    )
    if status:
        query = query.filter(Application.status == status)

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return ApplicationListResponse(items=items, total=total, page=page, size=size)


@router.get("/me/applications", response_model=ApplicationListResponse)
def my_applications(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    if current_user.role != UserRole.student:
        raise ForbiddenError("Доступ лише для студентів")

    query = db.query(Application).filter(Application.student_id == current_user.student_profile.id)
    total = query.count()
    items = (
        query.options(joinedload(Application.project))
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return ApplicationListResponse(items=items, total=total, page=page, size=size)


@router.patch("/applications/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: uuid.UUID,
    data: ApplicationStatusUpdate,
    current_user: CurrentUser,
    db: DB,
):
    application = (
        db.query(Application)
        .options(joinedload(Application.project), joinedload(Application.student))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise NotFoundError("Заявку не знайдено")

    project = application.project
    if current_user.role == UserRole.company:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Доступ лише власнику проєкту")
    elif current_user.role != UserRole.admin:
        raise ForbiddenError("Недостатньо прав")

    if application.status != ApplicationStatus.pending:
        raise BadRequestError("Можна змінити статус лише очікуючих заявок")

    application.status = ApplicationStatus(data.status)

    if data.status == "accepted":
        project.status = ProjectStatus.in_progress

    status_text = "прийнята" if data.status == "accepted" else "відхилена"
    notification = Notification(
        user_id=application.student.user_id,
        type=f"application_{data.status}",
        title=f"Заявка {status_text}",
        message=f"Ваша заявка на проєкт «{project.title}» була {status_text}",
        metadata_json={"project_id": str(project.id), "application_id": str(application.id)},
    )
    db.add(notification)

    db.commit()
    db.refresh(application)
    return application
