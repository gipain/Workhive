import uuid

from fastapi import APIRouter
from fastapi.responses import FileResponse
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, DB
from app.core.exceptions import NotFoundError
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


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(certificate_id: uuid.UUID, db: DB):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise NotFoundError("Сертифікат не знайдено")
    return cert


@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: uuid.UUID, db: DB):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise NotFoundError("Сертифікат не знайдено")

    import os
    if not os.path.exists(cert.pdf_url):
        raise NotFoundError("PDF файл не знайдено")

    return FileResponse(
        cert.pdf_url,
        media_type="application/pdf",
        filename=f"workhive_certificate_{certificate_id}.pdf",
    )
