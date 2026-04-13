from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, create_reset_token, decode_reset_token
from app.core.email import send_password_reset_email
from app.core.exceptions import BadRequestError, UnauthorizedError, ConflictError
from app.models.user import User, UserRole, StudentProfile, CompanyProfile
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest
from app.schemas.user import UserWithProfile
from app.api.deps import CurrentUser, DB

router = APIRouter(prefix="/auth", tags=["Автентифікація"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: DB):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ConflictError("Користувач з таким email вже існує")

    if data.role == "student":
        if not data.first_name or not data.last_name:
            raise BadRequestError("Для студента потрібні first_name та last_name")
    elif data.role == "company":
        if not data.company_name:
            raise BadRequestError("Для компанії потрібна назва company_name")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole(data.role),
    )
    db.add(user)
    db.flush()

    if data.role == "student":
        profile = StudentProfile(
            user_id=user.id,
            first_name=data.first_name,
            last_name=data.last_name,
        )
        db.add(profile)
    elif data.role == "company":
        profile = CompanyProfile(
            user_id=user.id,
            company_name=data.company_name,
        )
        db.add(profile)

    db.commit()

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: DB):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedError("Невірний email або пароль")
    if not user.is_active:
        raise UnauthorizedError("Акаунт деактивовано")

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: DB):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Невалідний refresh токен")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedError("Користувача не знайдено або акаунт деактивовано")

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserWithProfile)
def get_me(current_user: CurrentUser):
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(data: ForgotPasswordRequest, db: DB):
    """
    Generate a password-reset token and send it by email (Resend).
    If RESEND_API_KEY is not configured, the token is returned in the response for development use.
    """
    from app.core.config import settings

    # Always return 200 to avoid user-enumeration attacks
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.is_active:
        return ForgotPasswordResponse(
            message="Якщо акаунт із таким email існує, ви отримаєте посилання для скидання пароля.",
            reset_token="",
        )

    reset_token = create_reset_token(str(data.email))

    # Send real email if Resend is configured
    send_password_reset_email(str(data.email), reset_token)

    # Only expose the raw token in the response when email is not configured (dev mode)
    exposed_token = "" if settings.RESEND_API_KEY else reset_token

    return ForgotPasswordResponse(
        message="Посилання для скидання пароля надіслано на ваш email." if settings.RESEND_API_KEY
                else "Токен для скидання пароля сформовано (email не налаштовано).",
        reset_token=exposed_token,
    )


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: DB):
    """Validates a reset token and updates the user's password."""
    email = decode_reset_token(data.token)
    if not email:
        raise BadRequestError("Токен недійсний або завершився термін його дії")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise BadRequestError("Користувача не знайдено")

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Пароль успішно змінено"}
