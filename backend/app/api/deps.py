from typing import Annotated
from functools import wraps

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.user import User, UserRole


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Токен не надано")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Невалідний токен")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Невалідний токен")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("Користувача не знайдено")
    if not user.is_active:
        raise ForbiddenError("Акаунт деактивовано")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]


def require_role(*roles: UserRole):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if current_user.role not in roles:
                raise ForbiddenError("Недостатньо прав для цієї дії")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
