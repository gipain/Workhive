import uuid
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from app.core.database import SessionLocal
from app.models.project import Project
from app.models.user import StudentProfile, CompanyProfile
from app.models.certificate import Certificate
from app.models.notification import Notification


TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))


def render_certificate_pdf_bytes(
    student_name: str,
    project_title: str,
    company_name: str,
    certificate_id: str,
    issue_date: str,
) -> bytes:
    """Render the certificate HTML template and return raw PDF bytes."""
    template = jinja_env.get_template("certificate.html")
    html_content = template.render(
        student_name=student_name,
        project_title=project_title,
        company_name=company_name,
        certificate_id=certificate_id,
        issue_date=issue_date,
    )
    return HTML(string=html_content).write_pdf()


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

        certificate = Certificate(
            project_id=project_id,
            student_id=student_id,
            pdf_url="generated-on-demand",
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
