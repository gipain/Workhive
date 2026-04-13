"""
Test configuration: uses the Docker PostgreSQL database with transaction rollback per test.

Set DATABASE_URL env var BEFORE app module imports to avoid
the lifespan trying to connect to the Docker-internal 'db' hostname.
"""
import os
import uuid

# Must set env BEFORE importing app modules
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://workhive:workhive_secret@localhost:5433/workhive",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app

# ---------- Test engine (same URL as above) ----------
engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------- Fixtures ----------

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Ensure all tables exist."""
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db():
    """Provide a transactional DB session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """FastAPI TestClient with overridden DB dependency."""
    def _override():
        yield db

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------- Auth helpers ----------

def register_student(client: TestClient, email: str = None, first_name: str = "Тест", last_name: str = "Студент") -> dict:
    if email is None:
        email = f"student_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "Test1234!",
        "role": "student",
        "first_name": first_name,
        "last_name": last_name,
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    data["email"] = email
    return data


def register_company(client: TestClient, email: str = None, company_name: str = "ТестКомпанія") -> dict:
    if email is None:
        email = f"company_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "Test1234!",
        "role": "company",
        "company_name": company_name,
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    data["email"] = email
    return data


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_project(client: TestClient, token: str, **overrides) -> dict:
    payload = {
        "title": "Тестовий проєкт",
        "description": "Опис проєкту для тестів",
        "max_applicants": 3,
    }
    payload.update(overrides)
    resp = client.post("/api/projects", json=payload, headers=auth_header(token))
    assert resp.status_code == 201, resp.text
    return resp.json()
