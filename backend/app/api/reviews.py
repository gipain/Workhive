import uuid

from fastapi import APIRouter, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError, ConflictError
from app.models.user import UserRole, StudentProfile
from app.models.project import Project, ProjectStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.review import Review
from app.models.notification import Notification
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewListResponse

router = APIRouter(tags=["Відгуки"])


def _update_student_rating(db: Session, student_id: uuid.UUID):
    result = db.query(sa_func.avg(Review.rating)).filter(Review.student_id == student_id).scalar()
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if student:
        student.rating_avg = round(float(result or 0), 2)
        completed = db.query(Review).filter(Review.student_id == student_id).count()
        student.total_completed = completed
        db.flush()


@router.post("/projects/{project_id}/reviews", response_model=ReviewResponse, status_code=201)
def create_review(
    project_id: uuid.UUID,
    data: ReviewCreate,
    current_user: CurrentUser,
    db: DB,
    background_tasks: BackgroundTasks,
):
    if current_user.role != UserRole.company:
        raise ForbiddenError("Тільки компанії можуть залишати відгуки")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")
    if project.company_id != current_user.company_profile.id:
        raise ForbiddenError("Відгук лише на свої проєкти")

    approved_submission = (
        db.query(Submission)
        .filter(
            Submission.project_id == project_id,
            Submission.status == SubmissionStatus.approved,
        )
        .first()
    )
    if not approved_submission:
        raise BadRequestError("Відгук можна залишити лише після затвердження здачі")

    existing = (
        db.query(Review)
        .filter(Review.project_id == project_id, Review.student_id == approved_submission.student_id)
        .first()
    )
    if existing:
        raise ConflictError("Відгук вже залишено")

    review = Review(
        project_id=project_id,
        student_id=approved_submission.student_id,
        company_id=current_user.company_profile.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)

    project.status = ProjectStatus.completed

    student = db.query(StudentProfile).filter(StudentProfile.id == approved_submission.student_id).first()
    notification = Notification(
        user_id=student.user_id,
        type="review_received",
        title="Новий відгук",
        message=f"Компанія «{current_user.company_profile.company_name}» залишила відгук ({data.rating}★) на проєкт «{project.title}»",
        metadata_json={"project_id": str(project_id), "review_id": str(review.id)},
    )
    db.add(notification)

    _update_student_rating(db, approved_submission.student_id)

    db.commit()
    db.refresh(review)

    from app.services.certificate_service import generate_certificate
    background_tasks.add_task(generate_certificate, str(project_id), str(approved_submission.student_id))

    return review


@router.get("/projects/{project_id}/reviews", response_model=ReviewListResponse)
def list_project_reviews(project_id: uuid.UUID, db: DB):
    query = db.query(Review).filter(Review.project_id == project_id)
    total = query.count()
    items = query.all()
    return ReviewListResponse(items=items, total=total, page=1, size=total or 1)


@router.get("/students/{student_id}/reviews", response_model=ReviewListResponse)
def list_student_reviews(student_id: uuid.UUID, db: DB):
    query = db.query(Review).filter(Review.student_id == student_id)
    total = query.count()
    items = query.all()
    return ReviewListResponse(items=items, total=total, page=1, size=total or 1)
