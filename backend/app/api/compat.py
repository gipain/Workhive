"""
Compatibility routes that match frontend expectations.
Delegates to existing logic in the main routers.
"""
import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.user import UserRole, StudentProfile, CompanyProfile
from app.models.project import Project, ProjectStatus
from app.models.application import Application, ApplicationStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.invitation import Invitation, InvitationStatus
from app.models.notification import Notification
from app.models.skill import Skill
from app.schemas.application import ApplicationResponse, ApplicationListResponse
from app.schemas.submission import SubmissionResponse, SubmissionListResponse
from app.schemas.invitation import InvitationResponse, InvitationListResponse
from app.schemas.student import StudentProfileResponse, StudentProfileUpdate, SkillResponse
from app.schemas.company import CompanyProfileResponse, CompanyProfileUpdate

router = APIRouter()


# ── Skills listing (no existing endpoint) ───────────────────────────
@router.get("/skills", response_model=list[SkillResponse], tags=["Навички"])
def list_skills(db: DB):
    return db.query(Skill).order_by(Skill.name).all()


# ── Student /me routes ──────────────────────────────────────────────
@router.get("/students/me", response_model=StudentProfileResponse, tags=["Студенти"])
def get_my_student_profile(current_user: CurrentUser, db: DB):
    if not current_user.student_profile:
        raise NotFoundError("Студентський профіль не знайдено")
    student = (
        db.query(StudentProfile)
        .options(selectinload(StudentProfile.skills))
        .filter(StudentProfile.id == current_user.student_profile.id)
        .first()
    )
    return student


@router.put("/students/me", response_model=StudentProfileResponse, tags=["Студенти"])
def update_my_student_profile(data: StudentProfileUpdate, current_user: CurrentUser, db: DB):
    if not current_user.student_profile:
        raise ForbiddenError("Ви не студент")
    from app.api.students import update_student
    return update_student(current_user.student_profile.id, data, current_user, db)


# ── Company /me routes ──────────────────────────────────────────────
@router.get("/companies/me", response_model=CompanyProfileResponse, tags=["Компанії"])
def get_my_company_profile(current_user: CurrentUser, db: DB):
    if not current_user.company_profile:
        raise NotFoundError("Профіль компанії не знайдено")
    return current_user.company_profile


@router.put("/companies/me", response_model=CompanyProfileResponse, tags=["Компанії"])
def update_my_company_profile(data: CompanyProfileUpdate, current_user: CurrentUser, db: DB):
    if not current_user.company_profile:
        raise ForbiddenError("Ви не компанія")
    from app.api.companies import update_company
    return update_company(current_user.company_profile.id, data, current_user, db)


# ── Flat application routes ─────────────────────────────────────────
@router.get("/applications/my", response_model=ApplicationListResponse, tags=["Заявки"])
def my_applications_compat(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    from app.api.applications import my_applications
    return my_applications(current_user, db, page, size)


@router.get("/applications/project/{project_id}", response_model=ApplicationListResponse, tags=["Заявки"])
def list_project_applications_compat(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
):
    from app.api.applications import list_project_applications
    return list_project_applications(project_id, current_user, db, page, size, status)


@router.post("/applications", response_model=ApplicationResponse, status_code=201, tags=["Заявки"])
def create_application_flat(
    data: dict,
    current_user: CurrentUser,
    db: DB,
):
    from app.schemas.application import ApplicationCreate
    from app.api.applications import apply_to_project

    project_id = data.get("project_id")
    if not project_id:
        raise BadRequestError("project_id обов'язковий")
    app_data = ApplicationCreate(cover_letter=data.get("cover_letter"))
    return apply_to_project(uuid.UUID(project_id), app_data, current_user, db)


@router.patch("/applications/{application_id}/accept", response_model=ApplicationResponse, tags=["Заявки"])
def accept_application(application_id: uuid.UUID, current_user: CurrentUser, db: DB):
    from app.schemas.application import ApplicationStatusUpdate
    from app.api.applications import update_application_status
    return update_application_status(application_id, ApplicationStatusUpdate(status="accepted"), current_user, db)


@router.patch("/applications/{application_id}/reject", response_model=ApplicationResponse, tags=["Заявки"])
def reject_application(application_id: uuid.UUID, current_user: CurrentUser, db: DB):
    from app.schemas.application import ApplicationStatusUpdate
    from app.api.applications import update_application_status
    return update_application_status(application_id, ApplicationStatusUpdate(status="rejected"), current_user, db)


# ── Flat submission routes ──────────────────────────────────────────
@router.get("/submissions", response_model=SubmissionListResponse, tags=["Здачі робіт"])
def list_submissions_flat(
    current_user: CurrentUser,
    db: DB,
    project_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    if not project_id:
        raise BadRequestError("project_id обов'язковий")
    from app.api.submissions import list_submissions
    return list_submissions(project_id, current_user, db, page, size)


@router.post("/submissions", response_model=SubmissionResponse, status_code=201, tags=["Здачі робіт"])
def create_submission_flat(
    data: dict,
    current_user: CurrentUser,
    db: DB,
):
    from app.schemas.submission import SubmissionCreate
    from app.api.submissions import create_submission

    project_id = data.get("project_id")
    if not project_id:
        raise BadRequestError("project_id обов'язковий")
    sub_data = SubmissionCreate(
        comment=data.get("content") or data.get("comment"),
        file_url=data.get("file_url"),
        link_url=data.get("link_url"),
    )
    return create_submission(uuid.UUID(project_id), sub_data, current_user, db)


# ── Flat review routes ──────────────────────────────────────────────
from app.schemas.review import ReviewResponse
from pydantic import BaseModel


class _ReviewFlatCreate(BaseModel):
    project_id: uuid.UUID
    student_id: uuid.UUID | None = None
    rating: int = 5
    comment: str | None = None


@router.post("/reviews", response_model=ReviewResponse, status_code=201, tags=["Відгуки"])
def create_review_flat(
    data: _ReviewFlatCreate,
    current_user: CurrentUser,
    db: DB,
):
    from app.schemas.review import ReviewCreate
    from app.models.review import Review
    from app.models.project import ProjectStatus
    from app.models.submission import Submission, SubmissionStatus
    from app.models.notification import Notification
    from app.core.exceptions import ConflictError

    if current_user.role != UserRole.company:
        raise ForbiddenError("Тільки компанії можуть залишати відгуки")

    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")
    if project.company_id != current_user.company_profile.id:
        raise ForbiddenError("Відгук лише на свої проєкти")

    # Find approved submission for the student
    sub_query = db.query(Submission).filter(
        Submission.project_id == data.project_id,
        Submission.status == SubmissionStatus.approved,
    )
    if data.student_id:
        sub_query = sub_query.filter(Submission.student_id == data.student_id)
    approved_submission = sub_query.first()
    if not approved_submission:
        raise BadRequestError("Відгук можна залишити лише після затвердження здачі")

    student_id = approved_submission.student_id

    existing = db.query(Review).filter(
        Review.project_id == data.project_id, Review.student_id == student_id
    ).first()
    if existing:
        raise ConflictError("Відгук вже залишено")

    review = Review(
        project_id=data.project_id,
        student_id=student_id,
        company_id=current_user.company_profile.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    project.status = ProjectStatus.completed

    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    notification = Notification(
        user_id=student.user_id,
        type="review_received",
        title="Новий відгук",
        message=f"Компанія «{current_user.company_profile.company_name}» залишила відгук ({data.rating}★)",
        metadata_json={"project_id": str(data.project_id), "review_id": str(review.id)},
    )
    db.add(notification)

    db.flush()  # Ensure review is visible for rating calculation
    from app.api.reviews import _update_student_rating
    _update_student_rating(db, student_id)

    db.commit()
    db.refresh(review)

    from app.services.certificate_service import generate_certificate
    from threading import Thread
    Thread(target=generate_certificate, args=(str(data.project_id), str(student_id))).start()

    return review


# ── Invitation /my route ────────────────────────────────────────────
@router.get("/invitations/my", response_model=InvitationListResponse, tags=["Запрошення"])
def my_invitations_compat(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    from app.api.invitations import my_invitations
    return my_invitations(current_user, db, page, size)


@router.patch("/invitations/{invitation_id}/accept", response_model=InvitationResponse, tags=["Запрошення"])
def accept_invitation(invitation_id: uuid.UUID, current_user: CurrentUser, db: DB):
    from app.schemas.invitation import InvitationStatusUpdate
    from app.api.invitations import respond_to_invitation
    return respond_to_invitation(invitation_id, InvitationStatusUpdate(status="accepted"), current_user, db)


@router.patch("/invitations/{invitation_id}/decline", response_model=InvitationResponse, tags=["Запрошення"])
def decline_invitation(invitation_id: uuid.UUID, current_user: CurrentUser, db: DB):
    from app.schemas.invitation import InvitationStatusUpdate
    from app.api.invitations import respond_to_invitation
    return respond_to_invitation(invitation_id, InvitationStatusUpdate(status="declined"), current_user, db)
