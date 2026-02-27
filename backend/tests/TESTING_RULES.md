# Backend Testing Rules

## Scope
This document defines the required test taxonomy, ownership boundaries, naming conventions, concurrency rules, and definition-of-done criteria for the backend test suite.

## Suite Taxonomy

### `tests/unit/**`
- Purpose: pure logic validation.
- Allowed: deterministic functions, mappers, calculators, parsers, guards, data transformers.
- Disallowed: database access, HTTP calls, filesystem writes/reads, Docker/network access, real timers, process-level side effects.
- Pass criteria:
  - Fully isolated from infrastructure.
  - Fast and deterministic.
  - No global mutable state leaks.
  - No dependency on execution order.

### `tests/integration/**`
- Purpose: validate service/repository behavior against real database semantics.
- Allowed: DB connection, migrations, repositories, service orchestration, transactions, uniqueness/conflict behavior, query correctness.
- Disallowed: HTTP endpoint contract assertions, router/middleware wiring assertions.
- Pass criteria:
  - Uses test database only.
  - Verifies persistence side effects and invariants.
  - Cleans data between tests.
  - No reliance on data from other test files.

### `tests/api/**`
- Purpose: validate HTTP contract boundaries with Supertest.
- Allowed: request/response contract, auth boundaries, middleware behavior, route wiring, representative validation and AppError mapping checks.
- Disallowed: deep DB invariant duplication already covered by integration tests.
- Pass criteria:
  - Verifies status codes, response envelope, and key payload contract.
  - Verifies auth and tenant boundary at route level.
  - Covers representative validation and known error mapping paths.
  - Keeps assertions minimal and boundary-focused.

## What Belongs vs Does Not Belong

### Unit
- Belongs: rules in `core-dashboard` aggregation helpers, chatbot input validation rules, deterministic transforms.
- Does not belong: `sequelize` model calls, `supertest`, migrations, container control.

### Integration
- Belongs: ETL upload status transitions, deduplication checks, repository filters (`uploadId`/`uploadIds` scoping), governance owner updates, chat transaction rollbacks.
- Does not belong: cookie/header contract checks, response envelope shape checks.

### API
- Belongs: `401/403/400/404/409` boundaries, route mount correctness, representative happy path checks.
- Does not belong: exhaustive permutation testing of service calculations and DB internals.

## Parallelism Rules
- `unit`: parallel execution allowed.
- `integration`: serial execution required when sharing the same DB instance.
- `api`: serial execution required when sharing the same DB instance.
- If DB isolation is per-schema/per-container in future, concurrency can be increased only with explicit isolation guarantees.

## Naming and Layout Rules
- Test file extension: `.test.js`.
- Module folder convention is mandatory for each layer:
  - `tests/unit/auth/`
  - `tests/unit/inquiry/`
  - `tests/unit/chatbot/`
  - `tests/unit/etl/`
  - `tests/unit/core-dashboard/`
  - `tests/integration/auth/`
  - `tests/integration/inquiry/`
  - `tests/integration/chatbot/`
  - `tests/integration/etl/`
  - `tests/integration/core-dashboard/`
  - `tests/api/auth/`
  - `tests/api/inquiry/`
  - `tests/api/chatbot/`
  - `tests/api/etl/`
  - `tests/api/core-dashboard/`
- Test names should follow `feature.behavior.test.js` (example: `auth.signin.test.js`, `etl.upload-lifecycle.test.js`).

## Definition of Done Template
For every endpoint/flow selected for coverage, the owning test layer must include all applicable items below:

- Happy path:
  - Valid request succeeds and expected side effects occur.
- Auth and tenant isolation (if applicable):
  - Unauthenticated path fails with `401`.
  - Wrong tenant/user context cannot access or mutate cross-tenant data.
- Validation failure:
  - Invalid payload/query/params fail with `400`.
- Not found / conflict (if applicable):
  - Missing entity yields `404`.
  - State conflict yields `409`.
- AppError mapping:
  - Failure path maps to standardized error envelope with expected HTTP status/code family.

## Layer Ownership Policy
- First preference for assertions:
  - Business rules and data invariants: integration.
  - HTTP/middleware/auth boundary: API.
  - Deterministic pure rules: unit.
- API tests must not duplicate detailed query correctness already asserted in integration tests.
- A flow can be touched by multiple layers, but one layer is the source-of-truth for its primary assertions.
