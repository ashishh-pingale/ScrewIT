# Phase 1 architecture

The Phase 1 deployment is a modular monolith: a Next.js web client communicates with the FastAPI backend under `/api/v1`; the backend holds the PostgreSQL connection configuration and exposes health checks. PostgreSQL is the future system of record. No matching, extraction, normalization, material records, or AI provider integrations are implemented in this phase.

Docker Compose runs three services: `frontend` on port 3000, `backend` on port 8000, and PostgreSQL (`db`) on port 5432.

## Material-master persistence

The initial Alembic migration creates `standard_materials`, `materials`, `material_matches`, and `review_decisions`. `MaterialMatch.candidate_material_id` intentionally references `standard_materials`: a match proposal compares a CPSE source record to a governed canonical identity. Review decisions remain separate, append-only records linked to a match proposal.
