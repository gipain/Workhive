# WorkHive — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- A server running Linux (Ubuntu 22.04+ recommended)
- Domain pointed at the server's IP

---

## 1. Clone the repository

```bash
git clone <your-repo-url> workhive
cd workhive
```

---

## 2. Configure environment variables

```bash
cp .env.example .env
nano .env          # fill in all CHANGE_ME values
```

Key variables to set:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Random 32-byte hex string (`openssl rand -hex 32`) |
| `DATABASE_URL` | `postgresql://workhive:<PASSWORD>@db:5432/workhive` |
| `POSTGRES_PASSWORD` | Same password as `DATABASE_URL` |
| `FRONTEND_URL` | Public URL of frontend, e.g. `https://workhive.example.com` |

---

## 3. (Optional) Configure HTTPS with nginx reverse proxy

If you want HTTPS, place a system-level nginx or Caddy in front of the `frontend` container, or mount certificates into the container.

Simplest option — Caddy as a reverse proxy:

```
workhive.example.com {
    reverse_proxy localhost:80
}
```

---

## 4. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 5. Run database migrations

The backend uses SQLAlchemy with `create_all()` (auto-creates tables on startup). No manual migration step is required for the initial deploy.

For future schema changes, apply Alembic migrations:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 6. Create the first admin user

```bash
docker compose -f docker-compose.prod.yml exec backend python -c "
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
import uuid

db = SessionLocal()
admin = User(
    id=uuid.uuid4(),
    email='admin@example.com',
    hashed_password=hash_password('ChangeMe123!'),
    role=UserRole.admin,
)
db.add(admin)
db.commit()
print('Admin created:', admin.email)
db.close()
"
```

---

## 7. Verify the deployment

```bash
# Backend health
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Frontend
curl -sI http://localhost:80 | head -5
```

---

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build frontend backend
```

---

## Password Reset Flow

Since no email server is configured by default, the `POST /api/auth/forgot-password` endpoint returns the reset token in the JSON response (`reset_token`). In production:

1. Set `SENDGRID_API_KEY` in `.env`.
2. Implement `send_reset_email()` in `backend/app/core/email.py` using SendGrid.
3. Call it from the `forgot_password` endpoint instead of returning the token in the response.

Until then, the token is visible in the API response and displayed on the `/forgot-password` frontend page.

---

## Security checklist before going live

- [ ] `SECRET_KEY` is a random 32-byte string (not the example value)
- [ ] `POSTGRES_PASSWORD` is set and matches `DATABASE_URL`
- [ ] Docker DB port (`5432`) is **not** exposed publicly
- [ ] HTTPS is configured (Caddy / certbot / Cloudflare)
- [ ] Firewall allows only ports 80 and 443 from external traffic
- [ ] Admin account password is changed after creation
- [ ] `FRONTEND_URL` matches the actual public domain (required for CORS)
