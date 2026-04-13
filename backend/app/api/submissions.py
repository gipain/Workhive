import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.user import UserRole
from app.models.project import Project
from app.models.application import Application, ApplicationStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.notification import Notification
from app.schemas.submission import SubmissionCreate, SubmissionReview, SubmissionResponse, SubmissionListResponse

router = APIRouter(tags=["Здачі робіт"])


@router.post("/projects/{project_id}/submissions", response_model=SubmissionResponse, status_code=201)
def create_submission(project_id: uuid.UUID, data: SubmissionCreate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.student:
        raise ForbiddenError("Тільки студенти можуть здавати роботи")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    student = current_user.student_profile
    accepted_app = (
        db.query(Application)
        .filter(
            Application.project_id == project_id,
            Application.student_id == student.id,
            Application.status == ApplicationStatus.accepted,
        )
        .first()
    )
    if not accepted_app:
        raise ForbiddenError("Ви маєте мати прийняту заявку для здачі роботи")

    if not data.file_url and not data.link_url and not data.comment:
        raise BadRequestError("Потрібно додати файл, посилання або коментар")

    submission = Submission(
        project_id=project_id,
        student_id=student.id,
        comment=data.comment,
        file_url=data.file_url,
        link_url=data.link_url,
    )
    db.add(submission)

    notification = Notification(
        user_id=project.company.user_id,
        type="submission_received",
        title="Нова здача роботи",
        message=f"{student.first_name} {student.last_name} здав роботу по проєкту «{project.title}»",
        metadata_json={"project_id": str(project_id), "submission_id": str(submission.id)},
    )
    db.add(notification)

    db.commit()
    db.refresh(submission)
    return submission


@router.get("/projects/{project_id}/submissions", response_model=SubmissionListResponse)
def list_submissions(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    query = db.query(Submission).filter(Submission.project_id == project_id)

    if current_user.role == UserRole.student:
        query = query.filter(Submission.student_id == current_user.student_profile.id)
    elif current_user.role == UserRole.company:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Доступ лише власнику проєкту")

    total = query.count()
    items = (
        query.options(joinedload(Submission.student))
        .order_by(Submission.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return SubmissionListResponse(items=items, total=total, page=page, size=size)


@router.patch("/submissions/{submission_id}/review", response_model=SubmissionResponse)
def review_submission(
    submission_id: uuid.UUID,
    data: SubmissionReview,
    current_user: CurrentUser,
    db: DB,
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise NotFoundError("Здачу не знайдено")

    project = db.query(Project).filter(Project.id == submission.project_id).first()

    if current_user.role == UserRole.company:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Доступ лише власнику проєкту")
    elif current_user.role != UserRole.admin:
        raise ForbiddenError("Недостатньо прав")

    if submission.status == SubmissionStatus.approved:
        raise BadRequestError("Здача вже затверджена")

    submission.status = SubmissionStatus(data.status)
    submission.reviewer_comment = data.reviewer_comment

    from app.models.user import StudentProfile
    student = db.query(StudentProfile).filter(StudentProfile.id == submission.student_id).first()

    status_text = "затверджена" if data.status == "approved" else "потребує доопрацювання"
    notification = Notification(
        user_id=student.user_id,
        type=f"submission_{data.status}",
        title=f"Здача {status_text}",
        message=f"Ваша здача по проєкту «{project.title}» {status_text}",
        metadata_json={"project_id": str(project.id), "submission_id": str(submission.id)},
    )
    db.add(notification)

    db.commit()
    db.refresh(submission)
    return submission
