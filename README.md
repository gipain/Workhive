# WorkHive

Веб-платформа, що з'єднує студентів з реальними проєктами від компаній. Студенти отримують практичний досвід, компанії — мотивованих виконавців.

## Технології

### Backend
- **Python 3.12** + **FastAPI**
- **SQLAlchemy 2.0** (ORM) + **Alembic** (міграції)
- **PostgreSQL 15** (Supabase або Docker)
- **JWT** аутентифікація (access + refresh токени)
- **WeasyPrint** — генерація PDF-сертифікатів
- **Pydantic v2** — валідація даних

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** — збірка
- **TailwindCSS 4** — стилі
- **Zustand** — стейт-менеджмент
- **React Router v6** — роутинг
- **Axios** — HTTP-клієнт
- **react-hot-toast** — сповіщення
- **lucide-react** — іконки

## Функціонал

### Для студентів
- Перегляд та пошук проєктів (з фільтрами за навичками, статусом)
- Подача заявок на проєкти (з супровідним листом)
- Здача виконаної роботи
- Отримання PDF-сертифікатів після успішного завершення
- Профіль з навичками, рейтингом та портфоліо
- Прийом запрошень від компаній

### Для компаній
- Створення та управління проєктами
- Розгляд заявок студентів (прийняти / відхилити)
- Рецензування здач (прийняти / запросити зміни)
- Пошук студентів за навичками
- Відправка запрошень до проєктів
- Автоматичне створення відгуків та генерація сертифікатів

### Для адмінів
- Статистика платформи
- Управління користувачами (блокування)
- Розгляд скарг

## Швидкий запуск

### Через Docker Compose (рекомендовано)

```bash
# Запуск БД + backend
docker compose up -d

# Frontend (в іншому терміналі)
cd frontend
npm install
npm run dev
```

Відкрийте http://localhost:5173

### Ручний запуск

#### Backend

```bash
cd backend

# Створіть .env (з .env.example)
cp .env.example .env
# Відредагуйте DATABASE_URL i SECRET_KEY

# Віртуальне середовище
python3 -m venv .venv
source .venv/bin/activate

# Встановлення залежностей
pip install -r requirements.txt

# Міграції БД
alembic upgrade head

# Запуск
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Структура

```
├── backend/
│   ├── app/
│   │   ├── api/          # Ендпоінти (auth, projects, applications...)
│   │   ├── core/         # Конфіг, БД, безпека
│   │   ├── models/       # SQLAlchemy моделі
│   │   ├── schemas/      # Pydantic схеми
│   │   ├── services/     # Бізнес-логіка (сертифікати)
│   │   └── templates/    # HTML шаблони (сертифікат)
│   ├── alembic/          # Міграції БД
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # UI + layout + shared компоненти
│   │   ├── pages/        # Сторінки (auth, student, company, admin)
│   │   ├── store/        # Zustand сховища
│   │   ├── services/     # API клієнт
│   │   ├── hooks/        # Кастомні хуки
│   │   ├── types/        # TypeScript типи
│   │   ├── utils/        # Утиліти
│   │   └── i18n/         # Локалізація (UK)
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Деплой (безкоштовно)

| Сервіс | Платформа | Тариф |
|--------|-----------|-------|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| БД | Supabase | Free (500MB) |

## API Документація

Після запуску backend доcтупна за:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Ліцензія

MIT
