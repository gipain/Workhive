import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.user import User, UserRole, StudentProfile
from app.models.skill import Skill, student_skills
from app.schemas.student import StudentProfileResponse, StudentProfileUpdate, StudentListResponse

router = APIRouter(prefix="/students", tags=["Студенти"])


@router.get("", response_model=StudentListResponse)
def list_students(
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    skill: str | None = None,
    university: str | None = None,
    min_rating: float | None = None,
):
    query = db.query(StudentProfile).options(selectinload(StudentProfile.skills))

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                StudentProfile.first_name.ilike(term),
                StudentProfile.last_name.ilike(term),
                StudentProfile.bio.ilike(term),
            )
        )

    if university:
        query = query.filter(StudentProfile.university.ilike(f"%{university}%"))

    if min_rating is not None:
        query = query.filter(StudentProfile.rating_avg >= min_rating)

    if skill:
        query = query.join(StudentProfile.skills).filter(Skill.name.ilike(f"%{skill}%"))

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return StudentListResponse(items=items, total=total, page=page, size=size)


@router.get("/{student_id}", response_model=StudentProfileResponse)
def get_student(student_id: uuid.UUID, db: DB):
    student = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.skills))
        .filter(StudentProfile.id == student_id)
        .first()
    )
    # Fallback: try lookup by user_id
    if not student:
        student = (
            db.query(StudentProfile)
            .options(joinedload(StudentProfile.skills))
            .filter(StudentProfile.user_id == student_id)
            .first()
        )
    if not student:
        raise NotFoundError("Студента не знайдено")
    return student


@router.put("/{student_id}", response_model=StudentProfileResponse)
def update_student(student_id: uuid.UUID, data: StudentProfileUpdate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.admin:
        if not current_user.student_profile or current_user.student_profile.id != student_id:
            raise ForbiddenError("Можна редагувати лише свій профіль")

    student = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.skills))
        .filter(StudentProfile.id == student_id)
        .first()
    )
    if not student:
        raise NotFoundError("Студента не знайдено")

    update_data = data.model_dump(exclude_unset=True)

    skill_names = update_data.pop("skill_names", None)
    for key, value in update_data.items():
        setattr(student, key, value)

    if skill_names is not None:
        skills = []
        for name in skill_names:
            skill = db.query(Skill).filter(Skill.name == name.strip()).first()
            if not skill:
                skill = Skill(name=name.strip())
                db.add(skill)
                db.flush()
            skills.append(skill)
        student.skills = skills

    db.commit()
    db.refresh(student)
    return student
