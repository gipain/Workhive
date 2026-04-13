import uuid

from fastapi import APIRouter, Query
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.user import UserRole, CompanyProfile
from app.schemas.company import CompanyProfileResponse, CompanyProfileUpdate, CompanyListResponse

router = APIRouter(prefix="/companies", tags=["Компанії"])


@router.get("", response_model=CompanyListResponse)
def list_companies(
    db: DB,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    industry: str | None = None,
):
    query = db.query(CompanyProfile)

    if search:
        term = f"%{search}%"
        query = query.filter(CompanyProfile.company_name.ilike(term))

    if industry:
        query = query.filter(CompanyProfile.industry.ilike(f"%{industry}%"))

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return CompanyListResponse(items=items, total=total, page=page, size=size)


@router.get("/{company_id}", response_model=CompanyProfileResponse)
def get_company(company_id: uuid.UUID, db: DB):
    company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    # Fallback: try lookup by user_id
    if not company:
        company = db.query(CompanyProfile).filter(CompanyProfile.user_id == company_id).first()
    if not company:
        raise NotFoundError("Компанію не знайдено")
    return company


@router.put("/{company_id}", response_model=CompanyProfileResponse)
def update_company(company_id: uuid.UUID, data: CompanyProfileUpdate, current_user: CurrentUser, db: DB):
    if current_user.role != UserRole.admin:
        if not current_user.company_profile or current_user.company_profile.id != company_id:
            raise ForbiddenError("Можна редагувати лише свій профіль")

    company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    if not company:
        raise NotFoundError("Компанію не знайдено")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company
