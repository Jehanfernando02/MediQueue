# MediQueue

[![CI](https://github.com/Jehanfernando02/MediQueue/actions/workflows/ci.yml/badge.svg)](https://github.com/Jehanfernando02/MediQueue/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

A clinical appointment and patient flow management system for small clinics and hospitals. Three fully separated roles — **Patient**, **Doctor**, **Admin** — each with distinct access controls, real-time queue tracking, and a normalized PostgreSQL schema.

**Live Deployments**
| Service | URL |
|---|---|
| 🌐 Frontend (Vercel) | https://medi-queue.vercel.app |
| ⚙️ Backend API (Render) | https://mediqueue.onrender.com |
| 📖 API Docs (Swagger) | https://mediqueue.onrender.com/api/docs |
| 💚 Health Check | https://mediqueue.onrender.com/api/health |

---

## DevOps Skills Demonstrated

This project is engineered with production-grade DevOps practices throughout:

| Skill Area | Implementation |
|---|---|
| **CI/CD Pipelines** | GitHub Actions (`.github/workflows/ci.yml`) — backend pytest + frontend build run on every push/PR |
| **Containerisation** | Multi-stage `Dockerfile` (builder + slim runtime), non-root user, OCI labels |
| **Container Orchestration** | `docker-compose.yml` — API + PostgreSQL + Redis with `service_healthy` startup ordering |
| **Infrastructure as Code** | `render.yaml` (Render IaC), `docker-compose.yml`, `Jenkinsfile` all define infra declaratively |
| **Jenkins / Groovy** | `Jenkinsfile` — declarative Groovy pipeline with parallel stages, `timestamps()`, `timeout()`, `githubPush()` trigger |
| **Python Scripting** | `scripts/health_monitor.py` — zero-dependency stdlib health monitor with CI exit codes and `--watch` mode |
| **Health Monitoring** | `/api/health` endpoint + Python script + Docker `HEALTHCHECK` instruction |
| **Cloud Deployment** | Production hosted on Render (backend) + Vercel (frontend) with auto-deploy on push |
| **Documentation** | Architecture diagrams, API reference, deployment guides, runbooks |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
│                                                                 │
│  push/PR → GitHub Actions CI                                    │
│              ├── backend-ci  (Python/pytest + PostgreSQL svc)   │
│              ├── frontend-ci (Node/ESLint/Vite build)           │
│              └── docker-build (verify both Dockerfiles compile) │
└────────────────────────┬────────────────────────────────────────┘
                         │ auto-deploy on merge
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────┐         ┌──────────────────────┐
│  Vercel          │         │  Render              │
│  (Frontend)      │         │  (Backend)           │
│                  │  HTTPS  │                      │
│  React 19        │◄───────►│  FastAPI + Uvicorn   │
│  TanStack Router │         │  Gunicorn (4 workers)│
│  Redux Toolkit   │         │  Alembic migrations  │
└──────────────────┘         └─────────┬────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
             ┌────────────┐   ┌──────────────┐   ┌─────────────┐
             │ PostgreSQL │   │    Redis 7   │   │   Celery    │
             │ 16 (Neon)  │   │  (cache +    │   │  Workers    │
             │            │   │  JWT store)  │   │ (reminders) │
             └────────────┘   └──────────────┘   └─────────────┘
```

**Local Dev (Docker Compose):**
```
docker compose up  →  mediqueue-db + mediqueue-redis → mediqueue-api
                       (health-checked)    (health-checked)   (waits for both)
```

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

```
On push / PR to main
      │
      ├── Job: backend-ci
      │     ├── Spin up PostgreSQL 16 service container
      │     ├── pip install -r requirements.txt
      │     ├── alembic upgrade head
      │     ├── pytest tests/ -v
      │     └── Boot Uvicorn + curl /api/health
      │
      ├── Job: frontend-ci
      │     ├── npm ci
      │     ├── eslint .
      │     └── vite build  → uploads dist/ as artifact
      │
      └── Job: docker-build (after both pass)
            ├── Build backend Docker image
            └── Build frontend Docker image
```

### Jenkins Pipeline (`Jenkinsfile`)

Groovy declarative pipeline for self-hosted or EC2 deployments:

```
Checkout → Install Deps → Parallel(Tests + Frontend Build)
  → Docker Build → Docker Compose Deploy → Health Check → Cleanup
```

Triggered via `githubPush()` + GitHub webhook.

---

## Health Monitoring

### `/api/health` endpoint

```json
GET https://mediqueue.onrender.com/api/health

{
  "status": "ok",
  "version": "1.0.0",
  "env": "production"
}
```

Returns `200 OK` when healthy. Used by: Docker `HEALTHCHECK`, Python monitor script, Jenkins post-deploy stage.

### Python health monitor (`scripts/health_monitor.py`)

```bash
# Single check — exits 0 on success, 1 on failure (CI-compatible)
python3 scripts/health_monitor.py

# Custom URL
python3 scripts/health_monitor.py --url https://mediqueue.onrender.com/api/health

# Continuous watch mode — alerts after 3 consecutive failures
python3 scripts/health_monitor.py --watch --interval 30 --max-failures 3
```

Zero external dependencies — pure Python stdlib.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TanStack Router · Redux Toolkit · Axios · Vite |
| Backend | FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache / JWT Store | Redis 7 |
| Auth | JWT (access + refresh) · bcrypt · token rotation in Redis |
| Background tasks | Celery (appointment reminders, nightly cron) |
| Migrations | Alembic |
| Containerisation | Docker · Docker Compose |
| CI/CD | GitHub Actions · Jenkins (Groovy) |
| Deployment | Vercel (frontend) · Render (backend) |
| Monitoring | Python health monitor script · Docker HEALTHCHECK |

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
MediQueue/
├── .github/
│   └── workflows/
│       └── ci.yml              ← GitHub Actions CI pipeline
│
├── frontend/                   ← React 19 SPA
│   ├── Dockerfile              ← Multi-stage (Node builder + Nginx runtime)
│   ├── nginx.conf              ← SPA routing + security headers
│   ├── vercel.json             ← Vercel routing rules
│   └── src/
│       ├── routes/             ← 21 pages across 3 role dashboards
│       └── store/              ← Redux slices + Axios client
│
├── backend/                    ← FastAPI
│   ├── Dockerfile              ← Multi-stage (builder + slim runtime, non-root user)
│   ├── docker-compose.yml      ← API + PostgreSQL + Redis (health-checked)
│   ├── pytest.ini              ← Test configuration
│   ├── render.yaml             ← Render deployment IaC
│   ├── tests/
│   │   ├── conftest.py         ← pytest fixtures
│   │   └── test_health.py      ← 11 smoke tests for /api/health
│   └── app/
│       ├── main.py             ← FastAPI app factory + /api/health
│       ├── models/             ← 9 SQLAlchemy tables
│       ├── routers/            ← Thin route handlers
│       ├── services/           ← Business logic layer
│       ├── schemas/            ← Pydantic request/response
│       ├── middleware/         ← Auth · RBAC · RequestID · Audit · RateLimit
│       └── utils/              ← JWT · bcrypt · exceptions
│
├── scripts/
│   └── health_monitor.py       ← Python CLI health monitor (stdlib only)
│
└── Jenkinsfile                 ← Groovy declarative CI/CD pipeline
```

---

## Local Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+ / npm

### Quickstart with Docker Compose

```bash
cd backend

# Start all services — Postgres and Redis are health-checked before API starts
docker compose up

# API → http://localhost:8000
# Swagger → http://localhost:8000/api/docs
# Health  → http://localhost:8000/api/health
```

### Manual Backend Setup

```bash
cd backend

# 1. Start Postgres + Redis only
docker compose up db redis -d

# 2. Create virtualenv and install deps
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 3. Run migrations
alembic upgrade head

# 4. Start API
uvicorn app.main:app --reload --port 8000
```

### Run Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # → http://localhost:5173
npm run lint    # ESLint
npm run build   # Production bundle
```

### Run Health Monitor

```bash
# Against local dev
python3 scripts/health_monitor.py --url http://localhost:8000/api/health

# Against production (Render)
python3 scripts/health_monitor.py --url https://mediqueue.onrender.com/api/health --watch
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

## API Reference

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

GET    /api/health                      # health check (no auth required)
```

Full interactive docs: https://mediqueue.onrender.com/api/docs

---

## Key Engineering Decisions

**Slot conflict detection** — `SELECT FOR UPDATE` inside a DB transaction prevents double-booking under concurrent requests.

**Queue position** — calculated by skipping `cancelled`, `no_show`, and `done` statuses dynamically, not a simple count.

**Token rotation** — refresh tokens stored as `refresh:<hash> → user_id` in Redis, single-use. Deleted on logout or rotation.

**Audit immutability** — written by middleware, not service layer. No service can bypass it. Records are never updated or deleted.

**RBAC** — enforced at the service layer via a `require_roles()` dependency factory, not just at the route level.

**Container startup ordering** — `docker-compose.yml` uses `depends_on: condition: service_healthy` so the API waits for pg_isready and redis-cli ping before starting, eliminating race-condition crashes.

---

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Backend foundation — auth, models, Alembic, middleware | ✅ Done |
| 2 | Core services — doctors, appointments, queue, RBAC, audit, rate limiting | ✅ Done |
| 3 | DevOps — CI/CD (GitHub Actions + Jenkins), Docker, health monitoring, tests | ✅ Done |
| 4 | Frontend integration — Redux slices, Axios interceptors, replace all mock data | 🔄 In Progress |
