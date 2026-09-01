# ScrewIT

ScrewIT is an AI-assisted platform for standardizing and harmonizing material codes across CPSEs. Phase 1 establishes the maintainable application foundation only: a Next.js landing page, FastAPI API, PostgreSQL connection, and Docker development environment. It contains no AI matching or business-harmonization features.

## Prerequisites

- Docker Desktop with Docker Compose, for the complete stack.
- Node.js 20+ and npm, for local frontend development.
- Python 3.12+, for local backend development.

## Quick start with Docker

1. Copy `.env.example` to `.env` and set a non-default local PostgreSQL password.
2. Start the stack:

   ```powershell
   docker compose up --build
   ```

3. Open the landing page at `http://localhost:3000`.
4. Check the API at `http://localhost:8000/api/v1/health`.
5. Check PostgreSQL connectivity through `http://localhost:8000/api/v1/health/database`.

Apply the database schema migration after the stack has started:

```powershell
docker compose exec backend alembic upgrade head
```

Stop services with `docker compose down`. Add `--volumes` only when you intentionally want to remove local PostgreSQL data.

## Local development

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item ..\.env.example ..\.env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The local `DATABASE_URL` in `.env` expects PostgreSQL to be available on `localhost`. You can start only the database with `docker compose up db`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Verification commands

```powershell
cd frontend
npm run build

cd ..\backend
pytest
```

Generate SQL without applying it with `alembic upgrade head --sql`. Create a future migration with `alembic revision --autogenerate -m "describe change"`, review it, and then apply it with `alembic upgrade head`.

To execute backend tests through Docker, rebuild the image so it includes the test suite:

```powershell
docker compose build backend
docker compose run --rm backend sh -c "pip install -r requirements-dev.txt && pytest"
```

## Repository layout

- `frontend/` — Next.js TypeScript client.
- `backend/` — FastAPI application and backend tests.
- `data/` — controlled dictionaries and explicitly labelled sample data.
- `scripts/` — operational helper scripts.
- `tests/` — future cross-application test suites.
- `docs/` — architecture and operational documentation.

See `AGENTS.md` for required engineering, testing, explainability, and data-governance rules.
