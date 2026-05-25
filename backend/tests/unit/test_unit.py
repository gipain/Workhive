"""
Модульні тести (Unit Tests) для платформи WorkHive.
Покривають модуль безпеки (security), валідацію Pydantic-схем
та бізнес-логіку без залежності від бази даних.
"""
import os
# Встановлюємо DATABASE_URL ДО імпорту модулів застосунку
os.environ.setdefault("DATABASE_URL", "postgresql://workhive:workhive_secret@localhost:5433/workhive")

import time
import pytest
from pydantic import ValidationError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_reset_token,
    decode_reset_token,
)
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.project import ProjectCreate, ProjectUpdate


# ==============================================================================
# Тести модуля безпеки (app.core.security)
# ==============================================================================

class TestPasswordHashing:
    """Перевіряє хешування та верифікацію паролів (bcrypt)."""

    def test_hash_returns_string(self):
        result = hash_password("SecurePass1!")
        assert isinstance(result, str)

    def test_hash_is_not_plaintext(self):
        password = "SecurePass1!"
        result = hash_password(password)
        assert result != password

    def test_hash_different_each_call(self):
        """bcrypt генерує різні солі → різні хеші для одного пароля."""
        h1 = hash_password("SamePassword1!")
        h2 = hash_password("SamePassword1!")
        assert h1 != h2

    def test_verify_correct_password(self):
        password = "CorrectPass1!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("OriginalPass1!")
        assert verify_password("WrongPass1!", hashed) is False

    def test_verify_empty_password_fails(self):
        hashed = hash_password("RealPass1!")
        assert verify_password("", hashed) is False

    def test_verify_case_sensitive(self):
        hashed = hash_password("CaseSensitive1!")
        assert verify_password("casesensitive1!", hashed) is False


class TestJwtAccessToken:
    """Перевіряє генерацію та декодування access-токенів (HS256 / JWT)."""

    def test_create_returns_string(self):
        token = create_access_token({"sub": "user-uuid-001"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_has_three_segments(self):
        """Формат JWT: header.payload.signature."""
        token = create_access_token({"sub": "user-uuid-002"})
        assert token.count(".") == 2

    def test_decode_valid_token(self):
        payload = create_access_token({"sub": "user-uuid-003", "role": "student"})
        decoded = decode_token(payload)
        assert decoded is not None
        assert decoded["sub"] == "user-uuid-003"
        assert decoded["role"] == "student"
        assert decoded["type"] == "access"

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "user-uuid-004"})
        decoded = decode_token(token)
        assert "exp" in decoded

    def test_decode_invalid_token_returns_none(self):
        result = decode_token("invalid.token.here")
        assert result is None

    def test_decode_tampered_token_returns_none(self):
        token = create_access_token({"sub": "legit-user"})
        parts = token.split(".")
        parts[1] += "tampered"
        tampered = ".".join(parts)
        assert decode_token(tampered) is None

    def test_decode_empty_string_returns_none(self):
        assert decode_token("") is None


class TestJwtRefreshToken:
    """Перевіряє відокремлення access- та refresh-токенів."""

    def test_refresh_type_is_refresh(self):
        token = create_refresh_token({"sub": "user-uuid-010"})
        decoded = decode_token(token)
        assert decoded["type"] == "refresh"

    def test_access_and_refresh_are_different(self):
        data = {"sub": "user-uuid-011"}
        access = create_access_token(data)
        refresh = create_refresh_token(data)
        assert access != refresh

    def test_access_token_type_is_access(self):
        token = create_access_token({"sub": "user-uuid-012"})
        decoded = decode_token(token)
        assert decoded["type"] == "access"

    def test_refresh_expires_later_than_access(self):
        data = {"sub": "user-uuid-013"}
        access = create_access_token(data)
        refresh = create_refresh_token(data)
        dec_access = decode_token(access)
        dec_refresh = decode_token(refresh)
        assert dec_refresh["exp"] > dec_access["exp"]


class TestResetToken:
    """Перевіряє токени скидання пароля (30 хвилин, тип 'reset')."""

    def test_create_and_decode_reset_token(self):
        email = "user@example.com"
        token = create_reset_token(email)
        result = decode_reset_token(token)
        assert result == email

    def test_access_token_not_valid_as_reset(self):
        token = create_access_token({"sub": "user@example.com"})
        result = decode_reset_token(token)
        assert result is None

    def test_refresh_token_not_valid_as_reset(self):
        token = create_refresh_token({"sub": "user@example.com"})
        result = decode_reset_token(token)
        assert result is None

    def test_invalid_string_returns_none(self):
        result = decode_reset_token("garbage-string")
        assert result is None


# ==============================================================================
# Тести Pydantic-схем автентифікації (app.schemas.auth)
# ==============================================================================

class TestRegisterRequestSchema:
    """Перевіряє валідацію схеми реєстрації через Pydantic v2."""

    def test_valid_student_payload(self):
        data = RegisterRequest(
            email="ivan@knu.ua",
            password="StrongPass1!",
            role="student",
            first_name="Іван",
            last_name="Коваль",
        )
        assert data.role == "student"
        assert data.email == "ivan@knu.ua"

    def test_valid_company_payload(self):
        data = RegisterRequest(
            email="hr@softserve.com",
            password="StrongPass1!",
            role="company",
            company_name="SoftServe",
        )
        assert data.role == "company"

    def test_invalid_email_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            RegisterRequest(
                email="not-an-email",
                password="StrongPass1!",
                role="student",
                first_name="X",
                last_name="Y",
            )
        assert "email" in str(exc_info.value).lower() or "value" in str(exc_info.value).lower()

    def test_short_password_rejected(self):
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="user@test.com",
                password="Ab1!",          # < 8 символів
                role="student",
                first_name="X",
                last_name="Y",
            )

    def test_invalid_role_rejected(self):
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="admin@test.com",
                password="StrongPass1!",
                role="admin",             # не дозволена роль при реєстрації
                first_name="A",
                last_name="B",
            )

    def test_role_must_be_string(self):
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="x@test.com",
                password="StrongPass1!",
                role=42,
                first_name="X",
                last_name="Y",
            )


# ==============================================================================
# Тести Pydantic-схем проєктів (app.schemas.project)
# ==============================================================================

class TestProjectCreateSchema:
    """Перевіряє валідацію схеми створення проєкту."""

    def test_valid_minimal_project(self):
        data = ProjectCreate(
            title="Розробка API",
            description="Потрібно розробити REST API для мобільного застосунку.",
        )
        assert data.title == "Розробка API"
        assert data.is_draft is False
        assert data.max_applicants == 1

    def test_draft_flag_default_false(self):
        data = ProjectCreate(
            title="Тестовий проєкт",
            description="Детальний опис тестового проєкту для перевірки.",
        )
        assert data.is_draft is False

    def test_draft_flag_can_be_set_true(self):
        data = ProjectCreate(
            title="Чернетка проєкту",
            description="Це буде чернетка — студенти її ще не побачать.",
            is_draft=True,
        )
        assert data.is_draft is True

    def test_title_too_short_rejected(self):
        with pytest.raises(ValidationError):
            ProjectCreate(
                title="AB",               # < 3 символи
                description="Нормальний опис проєкту більше 10 символів.",
            )

    def test_description_too_short_rejected(self):
        with pytest.raises(ValidationError):
            ProjectCreate(
                title="Нормальна назва",
                description="Мало",      # < 10 символів
            )

    def test_max_applicants_lower_bound(self):
        with pytest.raises(ValidationError):
            ProjectCreate(
                title="Проєкт без студентів",
                description="Опис цього дивного проєкту.",
                max_applicants=0,         # нижче мінімуму (1)
            )

    def test_max_applicants_upper_bound(self):
        with pytest.raises(ValidationError):
            ProjectCreate(
                title="Масовий набір",
                description="Дуже великий проєкт для всіх студентів.",
                max_applicants=51,        # вище максимуму (50)
            )

    def test_max_applicants_valid_boundary(self):
        data = ProjectCreate(
            title="Проєкт для одного",
            description="Рівно один студент може взяти участь у цьому проєкті.",
            max_applicants=1,
        )
        assert data.max_applicants == 1

        data50 = ProjectCreate(
            title="Великий проєкт",
            description="П'ятдесят студентів можуть взяти участь у цьому великому проєкті.",
            max_applicants=50,
        )
        assert data50.max_applicants == 50

    def test_skills_default_empty_list(self):
        data = ProjectCreate(
            title="Без навичок",
            description="Жодних обов'язкових навичок для участі у цьому проєкті.",
        )
        assert data.skill_names == []

    def test_skills_populated(self):
        data = ProjectCreate(
            title="Python + React",
            description="Потрібна розробка повностекового застосунку.",
            skill_names=["Python", "React", "PostgreSQL"],
        )
        assert "Python" in data.skill_names
        assert len(data.skill_names) == 3


class TestProjectUpdateSchema:
    """Перевіряє валідацію схеми оновлення проєкту (всі поля опціональні)."""

    def test_empty_update_is_valid(self):
        """Порожнє оновлення дозволене (PATCH-семантика)."""
        data = ProjectUpdate()
        assert data.title is None
        assert data.description is None

    def test_partial_update_title_only(self):
        data = ProjectUpdate(title="Нова назва проєкту")
        assert data.title == "Нова назва проєкту"
        assert data.description is None

    def test_update_short_title_rejected(self):
        with pytest.raises(ValidationError):
            ProjectUpdate(title="AB")

    def test_update_max_applicants_invalid(self):
        with pytest.raises(ValidationError):
            ProjectUpdate(max_applicants=0)
