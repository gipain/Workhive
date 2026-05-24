import uuid

from fastapi import APIRouter
from fastapi.responses import Response
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.certificate import Certificate
from app.models.project import Project
from app.schemas.certificate import CertificateResponse, CertificateListResponse

router = APIRouter(prefix="/certificates", tags=["Сертифікати"])


@router.get("/student/{student_id}", response_model=CertificateListResponse)
def list_student_certificates(student_id: uuid.UUID, db: DB):
    query = db.query(Certificate).options(
        joinedload(Certificate.project).joinedload(Project.company)
    ).filter(Certificate.student_id == student_id)
    total = query.count()
    # Fallback: try lookup by user_id
    if total == 0:
        from app.models.user import StudentProfile
        sp = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
        if sp:
            query = db.query(Certificate).options(
                joinedload(Certificate.project).joinedload(Project.company)
            ).filter(Certificate.student_id == sp.id)
            total = query.count()
    items = query.order_by(Certificate.issued_at.desc()).all()
    return CertificateListResponse(items=items, total=total)


@router.get("/project/{project_id}", response_model=CertificateListResponse)
def list_project_certificates(project_id: uuid.UUID, current_user: CurrentUser, db: DB):
    """List all certificates for a project (accessible by the project's company or admin)."""
    from app.models.user import UserRole, CompanyProfile

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Проєкт не знайдено")

    # Only the owning company or admin can see project certificates
    if current_user.role not in (UserRole.admin,):
        if current_user.role == UserRole.company:
            company = db.query(CompanyProfile).filter(
                CompanyProfile.user_id == current_user.id,
                CompanyProfile.id == project.company_id,
            ).first()
            if not company:
                raise ForbiddenError("Доступ заборонено")
        # Students can also see (for their own certificates)

    query = db.query(Certificate).options(
        joinedload(Certificate.project).joinedload(Project.company)
    ).filter(Certificate.project_id == project_id)

    total = query.count()
    items = query.order_by(Certificate.issued_at.desc()).all()
    return CertificateListResponse(items=items, total=total)


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(certificate_id: uuid.UUID, db: DB):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise NotFoundError("Сертифікат не знайдено")
    return cert


@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: uuid.UUID, db: DB):
    from app.models.user import StudentProfile, CompanyProfile
    from app.services.certificate_service import render_certificate_pdf_bytes

    cert = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id)
        .first()
    )
    if not cert:
        raise NotFoundError("Сертифікат не знайдено")

    project = cert.project
    student = db.query(StudentProfile).filter(StudentProfile.id == cert.student_id).first()
    company = db.query(CompanyProfile).filter(CompanyProfile.id == project.company_id).first() if project else None

    student_name = f"{student.first_name} {student.last_name}" if student else "Студент"
    project_title = project.title if project else "Проєкт"
    company_name = company.company_name if company else "WorkHive"
    issue_date = cert.issued_at.strftime("%d.%m.%Y") if cert.issued_at else "—"
    cert_code = str(cert.id)[:8].upper()

    pdf_bytes = render_certificate_pdf_bytes(
        student_name=student_name,
        project_title=project_title,
        company_name=company_name,
        certificate_id=cert_code,
        issue_date=issue_date,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="workhive_certificate_{cert_code}.pdf"'},
    )
