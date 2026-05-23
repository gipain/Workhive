"""Seed script: 5 companies + 7 students with skills."""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole, StudentProfile, CompanyProfile
from app.models.skill import Skill

PASSWORD = "Password123!"

SKILLS_DATA = [
    "Python", "JavaScript", "React", "Django", "FastAPI",
    "SQL", "PostgreSQL", "Docker", "Git", "TypeScript",
    "Node.js", "Vue.js", "Machine Learning", "Data Analysis", "Figma",
    "UI/UX Design", "Java", "Spring Boot", "C++", "REST API",
]

COMPANIES = [
    {
        "email": "tech@softwave.ua",
        "company_name": "SoftWave",
        "description": "Компанія з розробки веб-застосунків та мобільних рішень для бізнесу.",
        "website": "https://softwave.ua",
        "industry": "IT / Software",
    },
    {
        "email": "hr@dataforge.com",
        "company_name": "DataForge Analytics",
        "description": "Аналітика даних та BI-рішення для великих підприємств. Спеціалізуємось на ML та Data Engineering.",
        "website": "https://dataforge.com",
        "industry": "Data / AI",
    },
    {
        "email": "jobs@creativestudio.ua",
        "company_name": "Creative Studio",
        "description": "Дизайн-студія, що займається UX/UI дизайном, брендингом та цифровим маркетингом.",
        "website": "https://creativestudio.ua",
        "industry": "Design / Marketing",
    },
    {
        "email": "career@cloudnext.io",
        "company_name": "CloudNext",
        "description": "Хмарна інфраструктура та DevOps-рішення. Допомагаємо компаніям мігрувати в хмару.",
        "website": "https://cloudnext.io",
        "industry": "Cloud / DevOps",
    },
    {
        "email": "talent@fintech-hub.com",
        "company_name": "FinTech Hub",
        "description": "Фінансові технології: платіжні системи, криптовалютні рішення та банківський софт.",
        "website": "https://fintech-hub.com",
        "industry": "FinTech",
    },
]

STUDENTS = [
    {
        "email": "olena.kovalenko@student.ua",
        "first_name": "Олена",
        "last_name": "Коваленко",
        "bio": "Студентка 4-го курсу КПІ, захоплююсь веб-розробкою та open-source проектами.",
        "university": "КПІ ім. Ігоря Сікорського",
        "graduation_year": 2025,
        "phone": "+380671234567",
        "skills": ["Python", "Django", "PostgreSQL", "Git"],
    },
    {
        "email": "mykola.petrenko@lnu.ua",
        "first_name": "Микола",
        "last_name": "Петренко",
        "bio": "Розробник frontend-застосунків. Люблю React та TypeScript, цікавлюсь Performance Optimization.",
        "university": "Львівський національний університет",
        "graduation_year": 2026,
        "phone": "+380632345678",
        "skills": ["JavaScript", "React", "TypeScript", "Git"],
    },
    {
        "email": "daryna.shevchenko@hneu.ua",
        "first_name": "Дарина",
        "last_name": "Шевченко",
        "bio": "Data Science ентузіастка. Досліджую машинне навчання та аналіз даних у фінансовій сфері.",
        "university": "ХНЕУ ім. Семена Кузнеця",
        "graduation_year": 2025,
        "phone": "+380503456789",
        "skills": ["Python", "Machine Learning", "Data Analysis", "SQL"],
    },
    {
        "email": "andriy.bondarenko@nau.ua",
        "first_name": "Андрій",
        "last_name": "Бондаренко",
        "bio": "Backend-розробник, спеціалізуюсь на Java та мікросервісній архітектурі.",
        "university": "Національний авіаційний університет",
        "graduation_year": 2026,
        "phone": "+380734567890",
        "skills": ["Java", "Spring Boot", "SQL", "Docker", "REST API"],
    },
    {
        "email": "sofia.marchenko@kneu.ua",
        "first_name": "Софія",
        "last_name": "Марченко",
        "bio": "UX/UI дизайнер-початківець. Захоплююсь продуктовим дизайном та дослідженням користувачів.",
        "university": "КНЕУ ім. Вадима Гетьмана",
        "graduation_year": 2025,
        "phone": "+380955678901",
        "skills": ["Figma", "UI/UX Design"],
    },
    {
        "email": "ivan.lysenko@lpnu.ua",
        "first_name": "Іван",
        "last_name": "Лисенко",
        "bio": "Fullstack-розробник з досвідом у Vue.js та Node.js. Цікавлюсь хмарними технологіями.",
        "university": "Львівська політехніка",
        "graduation_year": 2026,
        "phone": "+380676789012",
        "skills": ["Vue.js", "Node.js", "JavaScript", "Docker", "PostgreSQL"],
    },
    {
        "email": "tetiana.kravchuk@sumdu.ua",
        "first_name": "Тетяна",
        "last_name": "Кравчук",
        "bio": "Займаюсь розробкою API та автоматизацією. Активно вивчаю FastAPI та хмарні сервіси.",
        "university": "Сумський державний університет",
        "graduation_year": 2027,
        "phone": "+380737890123",
        "skills": ["Python", "FastAPI", "REST API", "Git", "SQL"],
    },
]


def seed():
    db = SessionLocal()
    try:
        # Create skills
        skill_map = {}
        for name in SKILLS_DATA:
            skill = db.query(Skill).filter(Skill.name == name).first()
            if not skill:
                skill = Skill(name=name)
                db.add(skill)
                db.flush()
            skill_map[name] = skill
        print(f"[+] Skills: {len(skill_map)}")

        # Create companies
        for data in COMPANIES:
            if db.query(User).filter(User.email == data["email"]).first():
                print(f"[~] Вже існує: {data['email']}")
                continue
            user = User(
                email=data["email"],
                hashed_password=hash_password(PASSWORD),
                role=UserRole.company,
                is_active=True,
            )
            db.add(user)
            db.flush()
            profile = CompanyProfile(
                user_id=user.id,
                company_name=data["company_name"],
                description=data["description"],
                website=data["website"],
                industry=data["industry"],
            )
            db.add(profile)
            print(f"[+] Компанія: {data['company_name']}")

        # Create students
        for data in STUDENTS:
            if db.query(User).filter(User.email == data["email"]).first():
                print(f"[~] Вже існує: {data['email']}")
                continue
            user = User(
                email=data["email"],
                hashed_password=hash_password(PASSWORD),
                role=UserRole.student,
                is_active=True,
            )
            db.add(user)
            db.flush()
            profile = StudentProfile(
                user_id=user.id,
                first_name=data["first_name"],
                last_name=data["last_name"],
                bio=data["bio"],
                university=data["university"],
                graduation_year=data["graduation_year"],
                phone=data["phone"],
            )
            for skill_name in data["skills"]:
                if skill_name in skill_map:
                    profile.skills.append(skill_map[skill_name])
            db.add(profile)
            print(f"[+] Студент: {data['first_name']} {data['last_name']}")

        db.commit()
        print("\n[✓] Готово! Пароль для всіх: Password123!")
    except Exception as e:
        db.rollback()
        print(f"[!] Помилка: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
