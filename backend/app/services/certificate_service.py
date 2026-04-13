import os
import uuid
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.user import StudentProfile, CompanyProfile
from app.models.certificate import Certificate
from app.models.notification import Notification


TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))


def generate_certificate(project_id: str, student_id: str):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not project or not student:
            return

        company = db.query(CompanyProfile).filter(CompanyProfile.id == project.company_id).first()

        existing = (
            db.query(Certificate)
            .filter(Certificate.project_id == project_id, Certificate.student_id == student_id)
            .first()
        )
        if existing:
            return

        template = jinja_env.get_template("certificate.html")
        html_content = template.render(
            student_name=f"{student.first_name} {student.last_name}",
            project_title=project.title,
            company_name=company.company_name if company else "WorkHive",
            certificate_id=str(uuid.uuid4())[:8].upper(),
            issue_date=project.updated_at.strftime("%d.%m.%Y") if project.updated_at else "—",
        )

        cert_dir = settings.upload_path / "certificates"
        cert_dir.mkdir(parents=True, exist_ok=True)

        filename = f"cert_{uuid.uuid4().hex}.pdf"
        pdf_path = cert_dir / filename

        HTML(string=html_content).write_pdf(str(pdf_path))

        certificate = Certificate(
            project_id=project_id,
            student_id=student_id,
            pdf_url=f"/files/uploads/certificates/{filename}",
        )
        db.add(certificate)

        notification = Notification(
            user_id=student.user_id,
            type="certificate_ready",
            title="Сертифікат готовий",
            message=f"Ваш сертифікат за проєкт «{project.title}» готовий до завантаження",
            metadata_json={"project_id": project_id, "certificate_id": str(certificate.id)},
        )
        db.add(notification)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Certificate generation error: {e}")
    finally:
        db.close()
