# MediQueue

A clinical appointment and patient flow management system for small clinics and hospitals. Three fully separated roles — **Patient**, **Doctor**, **Admin** — each with distinct access controls, real-time queue tracking, and a normalized PostgreSQL schema.

---

## The Idea

Small clinics run on whiteboards and phone calls. MediQueue replaces that with a role-aware web app where:

- **Patients** search doctors, book slots, and watch their queue position live
- **Doctors** manage today's patient queue, update statuses, and write consultation notes
- **Admins** oversee the entire clinic — doctors, departments, appointments, reports, and an immutable audit log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TanStack Start · TanStack Router · Redux Toolkit · Axios |
| Backend | FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Auth | JWT (access + refresh) · bcrypt · token rotation in Redis |
| Background tasks | Celery (reminders, nightly cron) |
| Migrations | Alembic |
| Infra | Docker Compose |

---

## Roles

```
Admin      → manage doctors, departments, slots · view all appointments · audit logs · reports
Doctor     → today's queue · update status (arrived / in-progress / done) · consultation notes
Patient    → book appointments · view history · live queue position · notifications
```

---

## Project Structure

```
mediwave-prime/
├── frontend/          # TanStack Start (React 19)
│   └── src/
│       ├── routes/    # 21 pages across 3 role dashboards
│       ├── store/     # Redux slices + Axios client (Phase 4)
│       └── lib/auth   # AuthProvider → migrates to Redux
│
└── backend/           # FastAPI
    ├── app/
    │   ├── models/    # 9 SQLAlchemy tables
    │   ├── routers/   # Thin route handlers
    │   ├── services/  # Business logic layer
    │   ├── schemas/   # Pydantic request/response
    │   ├── middleware/ # Auth · RBAC · RequestID · Logging
    │   └── utils/     # JWT · bcrypt · exceptions · response
    ├── alembic/       # DB migrations
    ├── docker-compose.yml
    └── .env.dev
```

---

## Database Schema

```
users              → id, email, password_hash, role, is_active
patients           → id, user_id, name, dob, blood_type, phone
departments        → id, name
doctors            → id, user_id, name, specialty, department_id, status, rating
time_slots         → id, doctor_id, day_of_week, start_time, end_time
appointments       → id, patient_id, doctor_id, slot_id, date, status   ← indexed on (doctor_id, date)
consultation_notes → id, appointment_id, doctor_id, content
notifications      → id, user_id, type, title, body, is_read
audit_logs         → id, user_id, action, entity, metadata (JSONB)      ← INSERT-ONLY
```

---

## API Summary

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/doctors                  # search + filter by specialty
GET    /api/v1/doctors/:id/slots        # available slots for a date
POST   /api/v1/appointments             # book (conflict-safe via SELECT FOR UPDATE)
GET    /api/v1/appointments/me          # patient's own history
PATCH  /api/v1/appointments/:id/status  # doctor updates queue status
POST   /api/v1/appointments/:id/notes   # doctor saves consultation note

GET    /api/v1/queue/my-position        # live queue position for patient
GET    /api/v1/notifications            # patient notifications

GET    /api/v1/admin/doctors            # admin CRUD
GET    /api/v1/analytics/overview       # dashboard stats
GET    /api/v1/audit-logs               # immutable audit trail
```

---

## Local Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+ / Bun

### Backend

```bash
cd backend

# 1. Start Postgres + Redis
docker-compose up db redis -d

# 2. Create virtualenv and install deps
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 3. Run migrations
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head

# 4. Start API
uvicorn app.main:app --reload --port 8000
# Swagger → http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend
bun install
bun dev
# → http://localhost:5173
```

### pgAdmin connection

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `mediqueue` |
| Username | `mediqueue` |
| Password | `mediqueue` |

---

## Key Engineering Decisions

**Slot conflict detection** — `SELECT FOR UPDATE` inside a DB transaction prevents double-booking under concurrent requests.

**Queue position** — calculated by skipping `cancelled`, `no_show`, and `done` statuses dynamically, not a simple count.

**Token rotation** — refresh tokens stored as `refresh:<hash> → user_id` in Redis, single-use. Deleted on logout or rotation.

**Audit immutability** — written by middleware, not service layer. No service can bypass it. Records are never updated or deleted.

**RBAC** — enforced at the service layer via a `require_roles()` dependency factory, not just at the route level.

---

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Backend foundation — auth, models, Alembic, middleware | ✅ Done |
| 2 | Core services — doctors, appointments, queue, RBAC, audit, rate limiting | 🔄 Next |
| 3 | Advanced — Redis cache, Celery tasks, analytics, tests, CI/CD | ⏳ |
| 4 | Frontend integration — Redux slices, Axios interceptors, replace all mock data | ⏳ |
# update
