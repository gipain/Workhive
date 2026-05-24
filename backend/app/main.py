from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, students, companies, projects, applications, invitations, submissions, reviews, certificates, notifications, files, admin, compat

# Import all models so Base.metadata knows about them
import app.models.user  # noqa
import app.models.skill  # noqa
import app.models.project  # noqa
import app.models.application  # noqa
import app.models.invitation  # noqa
import app.models.submission  # noqa
import app.models.review  # noqa
import app.models.certificate  # noqa
import app.models.notification  # noqa
import app.models.complaint  # noqa

limiter = Limiter(key_func=get_remote_address)


def _bootstrap_db():
    """Create admin user and seed demo data if they don't exist yet."""
    import uuid
    from app.core.database import SessionLocal
    from sqlalchemy import text
    from app.core.security import hash_password
    from app.models.user import User, UserRole, StudentProfile, CompanyProfile
    from app.models.skill import Skill

    db = SessionLocal()
    try:
        # ── Schema migrations (idempotent) ──────────────────────────────────
        db.execute(text(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS "
            "is_draft BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        db.commit()

        # ── Admin user ──────────────────────────────────────────────────────
        ADMIN_EMAIL = "admin@workhive.com"
        if not db.query(User).filter(User.email == ADMIN_EMAIL).first():
            admin = User(
                id=uuid.uuid4(),
                email=ADMIN_EMAIL,
                hashed_password=hash_password("Admin123456"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.commit()

        # ── Skills ──────────────────────────────────────────────────────────
        SKILLS_DATA = [
            "Python", "JavaScript", "React", "Django", "FastAPI",
            "SQL", "PostgreSQL", "Docker", "Git", "TypeScript",
            "Node.js", "Vue.js", "Machine Learning", "Data Analysis", "Figma",
            "UI/UX Design", "Java", "Spring Boot", "C++", "REST API",
        ]
        skill_map = {}
        for name in SKILLS_DATA:
            skill = db.query(Skill).filter(Skill.name == name).first()
            if not skill:
                skill = Skill(name=name)
                db.add(skill)
                db.flush()
            skill_map[name] = skill
        db.commit()

        # ── Companies ───────────────────────────────────────────────────────
        PASSWORD = "Password123!"
        COMPANIES = [
            {"email": "tech@softwave.ua", "company_name": "SoftWave",
             "description": "Компанія з розробки веб-застосунків та мобільних рішень.",
             "website": "https://softwave.ua", "industry": "IT / Software"},
            {"email": "hr@dataforge.com", "company_name": "DataForge Analytics",
             "description": "Аналітика даних та BI-рішення. ML та Data Engineering.",
             "website": "https://dataforge.com", "industry": "Data / AI"},
            {"email": "jobs@creativestudio.ua", "company_name": "Creative Studio",
             "description": "UX/UI дизайн, брендинг та цифровий маркетинг.",
             "website": "https://creativestudio.ua", "industry": "Design / Marketing"},
            {"email": "career@cloudnext.io", "company_name": "CloudNext",
             "description": "Хмарна інфраструктура та DevOps-рішення.",
             "website": "https://cloudnext.io", "industry": "Cloud / DevOps"},
            {"email": "talent@fintech-hub.com", "company_name": "FinTech Hub",
             "description": "Фінансові технології: платіжні системи та банківський софт.",
             "website": "https://fintech-hub.com", "industry": "FinTech"},
        ]
        for data in COMPANIES:
            if not db.query(User).filter(User.email == data["email"]).first():
                user = User(email=data["email"], hashed_password=hash_password(PASSWORD),
                            role=UserRole.company, is_active=True)
                db.add(user)
                db.flush()
                db.add(CompanyProfile(user_id=user.id, company_name=data["company_name"],
                                      description=data["description"],
                                      website=data["website"], industry=data["industry"]))
        db.commit()

        # ── Students ────────────────────────────────────────────────────────
        STUDENTS = [
            {"email": "olena.kovalenko@student.ua", "first_name": "Олена", "last_name": "Коваленко",
             "bio": "Студентка 4-го курсу КПІ, захоплююсь веб-розробкою та open-source.",
             "university": "КПІ ім. Ігоря Сікорського", "graduation_year": 2025,
             "phone": "+380671234567", "skills": ["Python", "Django", "PostgreSQL", "Git"]},
            {"email": "mykola.petrenko@lnu.ua", "first_name": "Микола", "last_name": "Петренко",
             "bio": "Frontend-розробник. React та TypeScript.",
             "university": "Львівський національний університет", "graduation_year": 2026,
             "phone": "+380632345678", "skills": ["JavaScript", "React", "TypeScript", "Git"]},
            {"email": "daryna.shevchenko@hneu.ua", "first_name": "Дарина", "last_name": "Шевченко",
             "bio": "Data Science ентузіастка. ML та аналіз даних.",
             "university": "ХНЕУ ім. Семена Кузнеця", "graduation_year": 2025,
             "phone": "+380503456789", "skills": ["Python", "Machine Learning", "Data Analysis", "SQL"]},
            {"email": "andriy.bondarenko@nau.ua", "first_name": "Андрій", "last_name": "Бондаренко",
             "bio": "Backend-розробник, Java та мікросервісна архітектура.",
             "university": "Національний авіаційний університет", "graduation_year": 2026,
             "phone": "+380734567890", "skills": ["Java", "Spring Boot", "SQL", "Docker", "REST API"]},
            {"email": "sofia.marchenko@kneu.ua", "first_name": "Софія", "last_name": "Марченко",
             "bio": "UX/UI дизайнер. Продуктовий дизайн та дослідження користувачів.",
             "university": "КНЕУ ім. Вадима Гетьмана", "graduation_year": 2025,
             "phone": "+380955678901", "skills": ["Figma", "UI/UX Design"]},
            {"email": "ivan.lysenko@lpnu.ua", "first_name": "Іван", "last_name": "Лисенко",
             "bio": "Fullstack-розробник. Vue.js та Node.js.",
             "university": "Львівська політехніка", "graduation_year": 2026,
             "phone": "+380676789012", "skills": ["Vue.js", "Node.js", "JavaScript", "Docker", "PostgreSQL"]},
            {"email": "tetiana.kravchuk@sumdu.ua", "first_name": "Тетяна", "last_name": "Кравчук",
             "bio": "Розробка API та автоматизація. FastAPI та хмарні сервіси.",
             "university": "Сумський державний університет", "graduation_year": 2027,
             "phone": "+380737890123", "skills": ["Python", "FastAPI", "REST API", "Git", "SQL"]},
        ]
        for data in STUDENTS:
            if not db.query(User).filter(User.email == data["email"]).first():
                user = User(email=data["email"], hashed_password=hash_password(PASSWORD),
                            role=UserRole.student, is_active=True)
                db.add(user)
                db.flush()
                profile = StudentProfile(
                    user_id=user.id, first_name=data["first_name"], last_name=data["last_name"],
                    bio=data["bio"], university=data["university"],
                    graduation_year=data["graduation_year"], phone=data["phone"],
                )
                for sname in data["skills"]:
                    if sname in skill_map:
                        profile.skills.append(skill_map[sname])
                db.add(profile)
        db.commit()

        # ── Recompute student stats from reviews ────────────────────────────
        # Fixes records created before the autoflush fix in reviews.py
        from app.models.review import Review
        from sqlalchemy import func as sa_func
        students = db.query(StudentProfile).all()
        for sp in students:
            result = db.query(sa_func.avg(Review.rating)).filter(Review.student_id == sp.id).scalar()
            count  = db.query(Review).filter(Review.student_id == sp.id).count()
            sp.rating_avg = round(float(result or 0), 2)
            sp.total_completed = count
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _bootstrap_db()
    yield


app = FastAPI(
    title="WorkHive API",
    description="Платформа для з'єднання студентів та компаній",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes — compat first so /students/me, /companies/me etc. win over /{id}
app.include_router(compat.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Serve uploaded files
import os
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/files/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "WorkHive API"}
