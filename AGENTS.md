# ScrewIT — Instructions for Codex Tasks

## Project purpose

ScrewIT is an AI-assisted Material Code Standardization and Harmonization Platform for Central Public Sector Enterprises (CPSEs). It helps map an organisation's local material records to a common, governed material identity.

The product is a decision-support system. It must recommend and explain possible harmonizations; it must never silently replace source material codes or autonomously approve a mapping.

## Non-negotiable engineering principles

Future work must prioritize, in this order:

1. Maintainability over novelty or premature optimization.
2. Human-in-the-loop validation for any material-code mapping that becomes authoritative.
3. Explainable AI: every recommendation must include evidence, score components, and model/version metadata.
4. Deterministic preprocessing: the same input and configuration must produce the same normalized output.
5. Testability: business rules and preprocessing must be independently unit-testable.
6. No fabricated data: do not invent source records, technical attributes, approvals, labels, benchmark results, or integration responses.
7. Strict separation between AI matching and deterministic business logic.

When requirements conflict with these principles, call out the conflict and choose the safer, auditable option unless the user explicitly directs otherwise.

## Target architecture

Build a modular monolith. Do not introduce microservices, distributed queues, or standalone vector databases unless a demonstrated requirement justifies them.

```text
React web client
        |
        v
FastAPI API
  |- ingestion and schema validation
  |- deterministic normalization and attribute parsing
  |- AI matching adapter
  |- deterministic candidate scoring and policy rules
  |- human-review workflow
  |- catalogue and crosswalk management
        |
        v
PostgreSQL + pgvector
```

The backend is the source of truth. The UI must use documented API contracts and must not duplicate business decisions or matching logic.

### Recommended boundaries

- **Ingestion** validates uploaded files, maps columns, records provenance, and persists unmodified raw values.
- **Normalization** performs versioned, deterministic cleanup and unit/abbreviation normalization.
- **Extraction** derives structured attributes from supplied text only, preserving source evidence and uncertainty.
- **AI matching** generates semantic candidates or similarity signals. It does not make final business decisions.
- **Scoring and policy** combine AI signals with exact attributes, category compatibility, units, and hard exclusion rules.
- **Review workflow** lets authorized users approve, reject, edit, or create a standard identity. Approved decisions form the governed crosswalk.

## Intended directory conventions

Use this layout as the application is created. Keep modules small and aligned to a single responsibility.

```text
frontend/
  src/
    components/       # reusable presentation components
    features/         # feature-specific UI and client state
    pages/            # routed screens
    services/         # typed API clients only
    types/            # UI-facing types

backend/
  app/
    api/              # route definitions, request/response handling
    core/             # configuration, logging, errors, security primitives
    models/           # ORM persistence models
    schemas/          # Pydantic request/response contracts
    repositories/     # database access abstractions
    services/
      ingestion/
      normalization/
      extraction/
      matching/       # AI adapters and candidate generation only
      scoring/        # deterministic scoring and policy rules
      review/         # validation workflow and audit events
    main.py
  tests/
    unit/
    integration/
    fixtures/

data/
  dictionaries/       # version-controlled rules, units, and verified synonyms
  sample/             # clearly labelled, non-production demo fixtures only
docs/
```

Do not place domain logic in API route handlers, ORM models, React components, or database migrations. Do not place secrets, real CPSE data, API keys, or unredacted uploads in the repository.

## Coding standards

### General

- Prefer explicit, readable code over clever abstractions.
- Keep functions focused and use descriptive domain names.
- Add type annotations for Python function interfaces and TypeScript code.
- Keep configuration in environment variables or typed settings; commit only `.env.example`.
- Use structured logging. Do not log full confidential uploads or secrets.
- Make error messages actionable and safe for users; retain technical detail in logs.
- Document non-obvious domain assumptions near the code and in `docs/` where appropriate.

### Python / backend

- Use FastAPI, Pydantic, SQLAlchemy, and Alembic when those components are introduced.
- Keep routes thin: validate input, call a service, return a schema.
- Use dependency injection for repositories, database sessions, AI providers, clock/randomness, and configuration when practical.
- Avoid network calls at import time.
- Pin dependency versions and add a dependency only when it has a clear role.
- Use UTC timestamps in storage and timezone-aware datetime values.

### TypeScript / frontend

- Use TypeScript strict mode.
- Keep components focused on rendering and interaction; use services/hooks for API communication.
- Model loading, empty, error, and permission states deliberately.
- Never calculate a final match decision or threshold only in the browser.
- Display match evidence, uncertainty, and reviewer action history where relevant.

## AI and matching conventions

### Deterministic preprocessing first

Normalize before invoking any model. The normalizer must be pure where possible and versioned. Preserve:

- raw source value;
- normalized value;
- normalizer version;
- transformations applied;
- source record and upload provenance.

Use deterministic rules for casing, whitespace, punctuation, known abbreviations, unit formatting, and parsed values. Rules and dictionaries must be version-controlled and tested.

### AI adapter boundary

All model/provider calls belong behind an interface in `backend/app/services/matching/`. Provider-specific prompts, SDK code, embedding calls, and retries must not leak into scoring, review, API, or UI code.

AI output is advisory and must be treated as untrusted input. Validate it against schemas before use. Never allow a model to directly write authoritative catalogue records, crosswalk mappings, or reviewer decisions.

### Explainability requirements

Each candidate recommendation must persist or return:

- candidate standard-material identifier;
- semantic similarity signal and model/provider version, if used;
- deterministic score components;
- matched and conflicting attributes;
- hard-rule exclusions, if any;
- overall score and configured threshold version;
- concise human-readable explanation;
- source data and preprocessing version references.

Scores must be reproducible from stored inputs, configuration, and model metadata as far as the chosen provider permits. If a model is nondeterministic, explicitly mark that limitation and keep final eligibility deterministic.

### Business rules stay separate

AI candidate generation answers: “what records might be semantically related?”

Business logic answers: “is this candidate eligible, how is confidence determined, and must it be reviewed?”

Hard incompatibilities—such as conflicting mandatory dimensions, grade, voltage, unit, or material family—must be enforced in deterministic scoring/policy code, not hidden in prompts.

## Human-review conventions

- Material mappings have a lifecycle such as `pending_review`, `approved`, `rejected`, or `superseded`.
- Only an explicit reviewer action may mark a mapping `approved`.
- Capture reviewer identity, timestamp, action, rationale, and previous/new values.
- Do not delete or overwrite source records; use immutable audit events and mapping versions.
- Rejections must not be silently reused as approved training data or positive examples.
- Low confidence, missing mandatory attributes, and policy conflicts must go to review rather than auto-approval.

## API conventions

- Version public endpoints under `/api/v1`.
- Use plural resource names, for example `/material-records`, `/standard-materials`, `/match-candidates`, and `/reviews`.
- Use Pydantic schemas for every request and response; never return ORM objects directly.
- Use appropriate status codes: `201` for creation, `200` for reads/updates, `204` for successful deletion where deletion is permitted, `400` for invalid requests, `404` for absent resources, and `409` for state/version conflicts.
- Return a consistent error shape with a machine-readable code, user-safe message, and field details where applicable.
- Support pagination for collection endpoints and document filters/sorting explicitly.
- Use idempotency protections for upload finalization and review approval actions when they are added.
- Put API examples and contract changes in `docs/` or OpenAPI descriptions.

## Database conventions

- PostgreSQL is authoritative; pgvector is an extension, not a separate source of truth.
- Use UUID primary keys unless a concrete interoperability requirement dictates otherwise.
- Use `created_at`, `updated_at`, and provenance fields on mutable domain entities.
- Store raw material records immutably or with version history. Never replace their original descriptions during normalization.
- Use normalized relational tables for standard materials, source records, candidate matches, mappings, reviews, audit events, and versioned rule/model metadata.
- Use `NUMERIC` for measured values where precision matters; never use floating point for financial values.
- Store units explicitly and normalize them through a controlled dictionary.
- Add foreign keys, unique constraints, and indexes intentionally; document non-obvious constraints.
- Apply schema changes only through reviewed, reversible Alembic migrations. Do not alter production-like schemas manually.
- Do not store plaintext credentials, raw API keys, or sensitive files in the database.

## Testing requirements

No feature is complete without relevant tests.

- Add unit tests for normalization, parsing, compatibility rules, scoring, lifecycle transitions, and explanations.
- Test preprocessing with table-driven cases including abbreviations, units, whitespace, malformed inputs, and ambiguous descriptions.
- Add regression tests for every corrected false-positive or false-negative match using approved, anonymized fixtures.
- Add integration tests for API routes, persistence constraints, ingestion validation, and review audit trails.
- Mock AI providers in unit and integration tests. Tests must not require network access, API credentials, or nondeterministic model outputs.
- Use only verified, synthetic, anonymized, or user-provided fixtures. Clearly label synthetic fixtures as synthetic.
- Assert explainability payloads as well as match outcome: score components, exclusions, and model/rule versions must be present.
- Run formatting, linting, type checks, and the relevant test suite before declaring work complete.

## Data integrity and privacy

- Treat CPSE material masters as potentially sensitive enterprise data.
- Retain upload provenance: source organization, file identifier, row number, import time, and column mapping.
- Validate files for schema, size, encoding, and malformed rows before persistence.
- Never claim a value was extracted, matched, approved, or sourced unless evidence is stored.
- Never manufacture demo accuracy metrics. State sample size, dataset origin, and evaluation method for all reported metrics.
- Do not train, fine-tune, or export data without explicit user authorization and a documented data-governance decision.

## Instructions for future Codex tasks

Before changing code:

1. Inspect the existing repository, relevant tests, and current conventions.
2. Identify whether the change belongs to ingestion, normalization, extraction, AI matching, deterministic scoring, review, API, persistence, or UI.
3. Preserve the separation of responsibilities above; do not solve a business-rule requirement by changing a prompt alone.
4. State assumptions when source data, taxonomy, approval policy, or threshold rules are unavailable. Do not invent them.
5. Make the smallest coherent change and avoid unrelated refactors.

When implementing a matching-related change:

1. Add or update deterministic tests and verified fixtures.
2. Ensure the response/audit record explains why the candidate was proposed or excluded.
3. Verify that no code path converts an AI suggestion into an approved mapping without an explicit reviewer action.
4. Version any changed rules, dictionaries, thresholds, prompts, and model configuration.

Before completing a task:

1. Run the relevant automated checks.
2. Report changed files, tests run, any unverified assumptions, and known limitations.
3. Do not describe a feature as production-ready unless security, data governance, auditability, and evaluation requirements have actually been met.
