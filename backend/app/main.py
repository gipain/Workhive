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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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
