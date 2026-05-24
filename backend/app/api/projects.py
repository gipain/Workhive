import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import or_

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.user import UserRole
from app.models.project import Project, ProjectStatus
from app.models.skill import Skill
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse

router = APIRouter(prefix="/projects", tags=["Проєкти"])


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

    if search:
        term = f"%{search}%"
        query = query.filter(or_(Project.title.ilike(term), Project.description.ilike(term)))

    if status:
        query = query.filter(Project.status == status)

    if company_id:
        # Support both company_profile.id and user.id lookups
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

    if project.status != ProjectStatus.open:
        raise BadRequestError("Можна редагувати лише відкриті проєкти")

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
