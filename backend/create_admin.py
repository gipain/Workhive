"""
Run this script once to create an admin user.
Usage:
    cd backend
    python create_admin.py admin@workhive.com YourPassword123
"""
import sys
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def create_admin(email: str, password: str) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"[!] Користувач {email} вже існує (роль: {existing.role})")
            return
        admin = User(
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[+] Адміністратор створений: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Використання: python create_admin.py <email> <пароль>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])
