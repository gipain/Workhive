import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.user import UserRole
from app.models.project import Project, ProjectStatus
from app.models.invitation import Invitation, InvitationStatus
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.schemas.invitation import InvitationCreate, InvitationStatusUpdate, InvitationResponse, InvitationListResponse

router = APIRouter(prefix="/invitations", tags=["Запрошення"])


@router.post("", response_model=InvitationResponse, status_code=201)
def create_invitation(data: InvitationCreate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.company:
        raise ForbiddenError("Тільки компанії можуть надсилати запрошення")

    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")
    if project.company_id != current_user.company_profile.id:
        raise ForbiddenError("Можна запрошувати лише на свої проєкти")
    if project.status != ProjectStatus.open:
        raise BadRequestError("Проєкт не приймає запрошення")

    from app.models.user import StudentProfile
    student = db.query(StudentProfile).filter(StudentProfile.id == data.student_id).first()
    if not student:
        # Fallback: try lookup by user_id
        student = db.query(StudentProfile).filter(StudentProfile.user_id == data.student_id).first()
    if not student:
        raise NotFoundError("Студента не знайдено")

    invitation = Invitation(
        project_id=data.project_id,
        student_id=student.id,
        company_id=current_user.company_profile.id,
        message=data.message,
    )
    db.add(invitation)

    notification = Notification(
        user_id=student.user_id,
        type="invitation_received",
        title="Нове запрошення",
        message=f"Компанія «{current_user.company_profile.company_name}» запросила вас до проєкту «{project.title}»",
        metadata_json={"project_id": str(data.project_id), "invitation_id": str(invitation.id)},
    )
    db.add(notification)

    db.commit()
    invitation = (
        db.query(Invitation)
        .options(joinedload(Invitation.project), joinedload(Invitation.company))
        .filter(Invitation.id == invitation.id)
        .first()
    )
    return invitation


@router.get("/me", response_model=InvitationListResponse)
def my_invitations(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    if current_user.role != UserRole.student:
        raise ForbiddenError("Доступ лише для студентів")

    query = db.query(Invitation).filter(Invitation.student_id == current_user.student_profile.id)
    total = query.count()
    items = (
        query.options(joinedload(Invitation.project), joinedload(Invitation.company))
        .order_by(Invitation.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return InvitationListResponse(items=items, total=total, page=page, size=size)


@router.patch("/{invitation_id}", response_model=InvitationResponse)
def respond_to_invitation(
    invitation_id: uuid.UUID,
    data: InvitationStatusUpdate,
    current_user: CurrentUser,
    db: DB,
):
    if current_user.role != UserRole.student:
        raise ForbiddenError("Тільки студенти можуть відповідати на запрошення")

    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        raise NotFoundError("Запрошення не знайдено")
    if invitation.student_id != current_user.student_profile.id:
        raise ForbiddenError("Це не ваше запрошення")
    if invitation.status != InvitationStatus.pending:
        raise BadRequestError("Запрошення вже оброблено")

    invitation.status = InvitationStatus(data.status)

    project = db.query(Project).filter(Project.id == invitation.project_id).first()
    status_text = "прийняв" if data.status == "accepted" else "відхилив"

    if data.status == "accepted":
        project.status = ProjectStatus.in_progress

        # Create (or update) an accepted Application so the student appears in the project
        existing_app = db.query(Application).filter(
            Application.project_id == invitation.project_id,
            Application.student_id == invitation.student_id,
        ).first()
        if existing_app:
            existing_app.status = ApplicationStatus.accepted
        else:
            db.add(Application(
                project_id=invitation.project_id,
                student_id=invitation.student_id,
                status=ApplicationStatus.accepted,
                cover_letter="(прийнято через запрошення)",
            ))

    notification = Notification(
        user_id=invitation.company.user_id,
        type=f"invitation_{data.status}",
        title=f"Запрошення {status_text}о",
        message=f"{current_user.student_profile.first_name} {current_user.student_profile.last_name} {status_text} запрошення до проєкту «{project.title}»",
        metadata_json={"project_id": str(invitation.project_id), "invitation_id": str(invitation.id)},
    )
    db.add(notification)

    db.commit()
    invitation = (
        db.query(Invitation)
        .options(joinedload(Invitation.project), joinedload(Invitation.company))
        .filter(Invitation.id == invitation.id)
        .first()
    )
    return invitation
