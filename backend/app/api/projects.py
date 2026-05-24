import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import or_
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DB
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.user import UserRole, User
from app.models.project import Project, ProjectStatus
from app.models.skill import Skill
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse

router = APIRouter(prefix="/projects", tags=["Проєкти"])


def _get_optional_user(
    authorization: Annotated[str | None, Depends(lambda: None)] = None,
    db: Session = Depends(get_db),
) -> User | None:
    return None


# ── Public list (hides drafts) ──────────────────────────────────────────────
@router.get("", response_model=ProjectListResponse)
def list_projects(
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    skill: str | None = None,
    company_id: uuid.UUID | None = None,
):
    query = db.query(Project).options(
        selectinload(Project.skills),
        joinedload(Project.company),
    )

    # Public listing always hides drafts
    query = query.filter(Project.is_draft == False)  # noqa: E712

    if search:
        term = f"%{search}%"
        query = query.filter(or_(Project.title.ilike(term), Project.description.ilike(term)))

    if status:
        query = query.filter(Project.status == status)

    if company_id:
        from app.models.user import CompanyProfile
        exists = db.query(Project).filter(Project.company_id == company_id).first()
        if not exists:
            cp = db.query(CompanyProfile).filter(CompanyProfile.user_id == company_id).first()
            if cp:
                company_id = cp.id
        query = query.filter(Project.company_id == company_id)

    if skill:
        query = query.join(Project.skills).filter(Skill.name.ilike(f"%{skill}%"))

    total = query.count()
    items = (
        query.order_by(Project.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return ProjectListResponse(items=items, total=total, page=page, size=size)


# ── Company: list own projects (including drafts) ────────────────────────────
@router.get("/my", response_model=ProjectListResponse)
def my_projects(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: str | None = None,
    include_drafts: bool = True,
):
    if current_user.role != UserRole.company:
        raise ForbiddenError("Тільки компанії мають власні проєкти")

    from app.models.user import CompanyProfile
    company = db.query(CompanyProfile).filter(
        CompanyProfile.user_id == current_user.id
    ).first()
    if not company:
        raise NotFoundError("Профіль компанії не знайдено")

    query = db.query(Project).options(
        selectinload(Project.skills),
        joinedload(Project.company),
    ).filter(Project.company_id == company.id)

    if not include_drafts:
        query = query.filter(Project.is_draft == False)  # noqa: E712

    if status:
        query = query.filter(Project.status == status)

    total = query.count()
    items = (
        query.order_by(Project.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return ProjectListResponse(items=items, total=total, page=page, size=size)


# ── Create ───────────────────────────────────────────────────────────────────
@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.company:
        raise ForbiddenError("Тільки компанії можуть створювати проєкти")

    from app.models.user import CompanyProfile
    company = db.query(CompanyProfile).filter(
        CompanyProfile.user_id == current_user.id
    ).first()
    if not company:
        raise ForbiddenError("Профіль компанії не знайдено")

    project = Project(
        company_id=company.id,
        title=data.title,
        description=data.description,
        requirements=data.requirements,
        deadline=data.deadline,
        max_applicants=data.max_applicants,
        is_draft=data.is_draft,
    )
    db.add(project)
    db.flush()

    if data.skill_names:
        for name in data.skill_names:
            skill = db.query(Skill).filter(Skill.name == name.strip()).first()
            if not skill:
                skill = Skill(name=name.strip())
                db.add(skill)
                db.flush()
            project.skills.append(skill)

    db.commit()
    db.refresh(project)
    return project


# ── Get single ───────────────────────────────────────────────────────────────
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, db: DB):
    project = (
        db.query(Project)
        .options(joinedload(Project.skills), joinedload(Project.company))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundError("Проєкт не знайдено")
    return project


# ── Update ───────────────────────────────────────────────────────────────────
@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: uuid.UUID, data: ProjectUpdate, current_user: CurrentUser, db: DB):
    project = (
        db.query(Project)
        .options(joinedload(Project.skills), joinedload(Project.company))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role != UserRole.admin:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Можна редагувати лише свої проєкти")

    if not project.is_draft and project.status != ProjectStatus.open:
        raise BadRequestError("Можна редагувати лише відкриті або чернеткові проєкти")

    update_data = data.model_dump(exclude_unset=True)
    skill_names = update_data.pop("skill_names", None)

    for key, value in update_data.items():
        setattr(project, key, value)

    if skill_names is not None:
        skills = []
        for name in skill_names:
            skill = db.query(Skill).filter(Skill.name == name.strip()).first()
            if not skill:
                skill = Skill(name=name.strip())
                db.add(skill)
                db.flush()
            skills.append(skill)
        project.skills = skills

    db.commit()
    db.refresh(project)
    return project


# ── Publish (draft → open) ───────────────────────────────────────────────────
@router.patch("/{project_id}/publish", response_model=ProjectResponse)
def publish_project(project_id: uuid.UUID, current_user: CurrentUser, db: DB):
    project = (
        db.query(Project)
        .options(selectinload(Project.skills), joinedload(Project.company))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role != UserRole.admin:
        from app.models.user import CompanyProfile
        company = db.query(CompanyProfile).filter(
            CompanyProfile.user_id == current_user.id
        ).first()
        if not company or project.company_id != company.id:
            raise ForbiddenError("Можна публікувати лише свої проєкти")

    if not project.is_draft:
        raise BadRequestError("Проєкт вже опублікований")

    project.is_draft = False
    db.commit()
    db.refresh(project)
    return project


# ── Move back to draft ────────────────────────────────────────────────────────
@router.patch("/{project_id}/draft", response_model=ProjectResponse)
def move_to_draft(project_id: uuid.UUID, current_user: CurrentUser, db: DB):
    project = (
        db.query(Project)
        .options(selectinload(Project.skills), joinedload(Project.company))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role != UserRole.admin:
        from app.models.user import CompanyProfile
        company = db.query(CompanyProfile).filter(
            CompanyProfile.user_id == current_user.id
        ).first()
        if not company or project.company_id != company.id:
            raise ForbiddenError("Можна редагувати лише свої проєкти")

    if project.status != ProjectStatus.open:
        raise BadRequestError("Повернути в чернетку можна лише відкритий проєкт без заявок")

    project.is_draft = True
    db.commit()
    db.refresh(project)
    return project


# ── Cancel ───────────────────────────────────────────────────────────────────
@router.patch("/{project_id}/cancel", response_model=ProjectResponse)
def cancel_project(project_id: uuid.UUID, current_user: CurrentUser, db: DB):
    project = (
        db.query(Project)
        .options(selectinload(Project.skills), joinedload(Project.company))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role != UserRole.admin:
        if not current_user.company_profile or project.company_id != current_user.company_profile.id:
            raise ForbiddenError("Можна скасувати лише свої проєкти")

    if project.status == ProjectStatus.completed:
        raise BadRequestError("Не можна скасувати завершений проєкт")

    project.status = ProjectStatus.cancelled
    db.commit()
    db.refresh(project)
    return project


# ── Delete (drafts only) ─────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: uuid.UUID, current_user: CurrentUser, db: DB):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    if current_user.role != UserRole.admin:
        from app.models.user import CompanyProfile
        company = db.query(CompanyProfile).filter(
            CompanyProfile.user_id == current_user.id
        ).first()
        if not company or project.company_id != company.id:
            raise ForbiddenError("Можна видаляти лише свої проєкти")

    if not project.is_draft and project.status not in (ProjectStatus.cancelled,):
        raise BadRequestError(
            "Видалити можна лише чернетку або скасований проєкт"
        )

    db.delete(project)
    db.commit()
