# 📘 Backend Testing Architecture & Implementation Report

## 1️⃣ Objective

This testing architecture was implemented to enforce clear test boundaries, reduce regression risk, and keep backend verification deterministic across local and CI-like execution.  
The architecture targets:

- Separation of concerns by test layer (`unit`, `integration`, `api`, `component`) so failures are attributable to the correct boundary.
- Risk mitigation for a multi-tenant SaaS backend by explicitly testing tenant/client scoping and cross-tenant denial paths.
- Deterministic DB-backed validation using Docker Postgres, controlled migrations, and repeatable cleanup.
- Reliability validation for workflow/state transitions and idempotency-critical flows.
- Safe external-adapter behavior through component tests with outbound network blocking.

## 2️⃣ Phase 0 — Testing Ground Rules & Suite Taxonomy

### 2.1 Suite Structure Standardization

Actual suite layout under `backend/tests/`:

- `tests/unit/**`
- `tests/integration/**`
- `tests/api/**`
- `tests/component/**`
- `tests/advanced/**` (planning/reporting artifact: `PHASE6_PLAN.md`)
- Shared support: `tests/helpers/**`, `tests/setup.js`, `tests/globalSetup.js`
- Additional scaffold folders present: `tests/contract/`, `tests/factories/`, `tests/fixtures/`

Separation exists to keep:

- Pure rule validation independent of infrastructure (`unit`).
- DB behavior and transactional invariants separate from HTTP (`integration`).
- HTTP contract/middleware/auth boundaries thin and representative (`api`).
- External dependency mapping isolated with mocks and no network (`component`).

### 2.2 Pass Criteria per Layer

Unit (`tests/unit/**`)

- Pure logic only; no DB, HTTP, or network.
- Enforced by design pattern: direct utility/service-lib imports such as:
  - `src/modules/shared/auth/lib/authTransition.utils.js`
  - `src/modules/shared/inquiry/lib/inquiryTransition.utils.js`
  - `src/modules/shared/ETL/lib/pollWorker.utils.js`

Integration (`tests/integration/**`)

- Service/repository + real DB invariants.
- Enforced by DB-backed helpers and global setup:
  - `tests/globalSetup.js` starts Docker DB, runs migrations, validates DB reachability.
  - `tests/setup.js` truncates tables after each DB test and closes DB handles.
- Integration tests call services directly (no Supertest).

API (`tests/api/**`)

- Route wiring, middleware/auth, validation, and error contracts.
- Enforced through `tests/helpers/apiApp.js` + Supertest client from `tests/helpers/http.js`.
- Error envelope consistency enforced with `tests/helpers/apiAssertions.js`.
- Deep DB invariants intentionally delegated to `integration`.

### 2.3 Parallelism Rules

Concurrency is configured in both Vitest config and npm scripts:

- `backend/vitest.config.js`
  - `fileParallelism: true` for `TEST_SUITE=unit|component`
  - `fileParallelism: false` and `maxConcurrency: 1` for DB suites
- `backend/package.json`
  - `test:integration` and `test:api` explicitly force serial execution:
    - `--no-file-parallelism --maxWorkers=1 --maxConcurrency=1 --testTimeout=45000`

Integration/API are serial because they share one Postgres instance and rely on deterministic truncation and migration state.

### 2.4 Definition of Done per Endpoint

Definition-of-done is implemented as repeated assertion patterns across API and integration suites:

- Happy path:
  - Examples: `tests/api/auth/auth.login.test.js`, `tests/api/inquiry/inquiry.create.test.js`, `tests/api/etl/etl.ingest.test.js`
- Validation failures:
  - Examples: malformed auth/inquiry/chatbot/etl/core-dashboard payloads returning `VALIDATION_ERROR`
- Isolation (tenant/client/auth):
  - Examples: `tests/api/chatbot/chatbot.tenancy.test.js`, `tests/api/etl/etl.tenancy.test.js`, `tests/api/core-dashboard/dashboard.tenancy.test.js`
- Error mapping:
  - Standardized envelope asserted via `assertErrorContract` in `tests/helpers/apiAssertions.js`

## 3️⃣ Phase 1 — Module Test Inventory

Actual backend modules under `src/modules/`:

- `shared/` (includes `auth`, `inquiry`, `chatbot`, `ETL`, `cloud`, `capabilities`, `user`)
- `core-dashboard/`
- `internal/` (includes `cloud-account-credentials`)
- `clients/` (includes `client-c`, `client-d`)

Documented inventory artifacts:

- `tests/TEST_INVENTORY.md`
- `tests/api/API_TEST_PLAN.md`
- `tests/integration/INTEGRATION_TEST_PLAN.md`
- Route registration source: `src/app.js` and module route files.

Identity context is explicitly considered in inventory and tests through JWT payload (`id`, `role`, `client_id`) and tenant helpers (`tests/helpers/tenancy.js`).

Primary DB models touched in tested modules include:

- Auth: `User`, `Client`, `BillingUpload`
- Inquiry: `Inquiry`
- Chatbot: `ChatSession`, `ChatMessage`
- ETL: `BillingUpload`, `BillingUsageFact`, mapping/dimension tables, `ClientS3Integrations`
- Core-dashboard: `BillingUsageFact` with analytics/reporting aggregates and upload scoping

Source-of-truth assignment is layer-based:

- Pure rule/transition/normalization: `unit`
- Transactional and DB invariants: `integration`
- HTTP contracts and middleware/auth boundaries: `api`

This improves quality by preventing assertion duplication and concentrating each class of risk in one authoritative layer.

## 4️⃣ Phase 2 — Unit Testing Implementation

### Auth

- Tested logic: verification transition rules, auth idempotency key, auth utility normalization/policy checks, JWT wrappers.
- Files: `tests/unit/auth/auth.transition.test.js`, `tests/unit/auth/auth.utils.test.js`, `tests/unit/auth/jwt.test.js`
- Determinism: direct function contracts, no external IO.
- Table-driven: used (`it.each`) for transition matrix.

### Inquiry

- Tested logic: inquiry transition validation, idempotency key generation, inquiry helper rules.
- Files: `tests/unit/inquiry/inquiry.transition-idempotency.test.js`, `tests/unit/inquiry/inquiry.utils.test.js`
- Determinism: normalized input-to-output checks and typed error assertions.
- Table-driven: used (`it.each`) for allowed/disallowed transitions.

### Chatbot

- Tested logic: chat rules validation, deep object setting, flow helpers, session state transitions, command key generation.
- Files: `tests/unit/chatbot/chat.rules.test.js`, `tests/unit/chatbot/deepSet.test.js`, `tests/unit/chatbot/flowHelpers.test.js`, `tests/unit/chatbot/session-status.test.js`
- Determinism: pure parser/rule/transition checks.
- Table-driven: used in transition coverage.

### ETL

- Tested logic: mapping utilities, provider detection, S3 ingest validation/fingerprint rules, dimension map resolution, upload-status transition rules, worker utility decisions.
- Files: `tests/unit/etl/*.test.js`
- Determinism: all tests are pure and infrastructure-free.
- Table-driven: used in transition/candidate eligibility checks.

### Core-dashboard

- Tested logic: upload ID normalization/scope helpers and resource aggregation helper logic.
- Files: `tests/unit/core-dashboard/*.test.js`
- Determinism: exact output/shape assertions.

Time control in unit layer:

- Time helper test and fake timer usage exist (`tests/unit/time.test.js`, `tests/unit/etl/poll-worker.utils.test.js`).

## 5️⃣ Phase 3 — Integration Testing (Service + DB)

Docker DB usage

- Docker Postgres is managed by `tests/helpers/docker.js` using `docker-compose.test.yml`.
- Global setup (`tests/globalSetup.js`) starts DB container (when configured), checks readiness, runs migrations, and truncates initial state.

Migration strategy

- `tests/helpers/migrate.js` runs `sequelize-cli db:migrate --env test` programmatically.
- Executed once in global setup for DB suites.

Truncation/reset strategy

- `tests/helpers/truncate.js` truncates all public tables except protected metadata tables.
- `tests/setup.js` truncates after each test for DB suites and closes DB on suite completion.

Transaction rollback validation

- Integration suites validate invalid transitions and failure paths with unchanged DB state:
  - Inquiry: `tests/integration/inquiry/inquiry.idempotency.test.js`
  - Chatbot: `tests/integration/chatbot/chat.session-state.test.js`
  - ETL upload status transitions: `tests/integration/etl/upload-status.service.test.js`

Tenant scoping enforcement

- Verified in service-level tests and upload scope integration:
  - `tests/integration/core-dashboard/upload-scope.integration.test.js`
  - `tests/integration/chatbot/chat.integration.service.test.js`

Module-level integration coverage exists for:

- `auth`, `inquiry`, `chatbot`, `etl`, `core-dashboard`, plus smoke/env checks (`db.smoke`, `env`).

## 6️⃣ Phase 4 — API Testing (Thin Contract Layer)

App bootstrapping in tests

- `tests/helpers/apiApp.js` dynamically imports `createApp` from `src/app.js`.
- Supertest client is created without binding a real network port.

Supertest usage

- HTTP helpers in `tests/helpers/http.js` provide `get/post/put/patch/delete` wrappers and bearer header utility.

Error contract validation

- `tests/helpers/apiAssertions.js` enforces status, error code, message presence, requestId, and sensitive-field leakage checks.

Authentication enforcement

- API tests verify protected-route denial and allowed authenticated paths:
  - `tests/api/auth/auth.protected.test.js`
  - `tests/api/chatbot/chatbot.messages.test.js`
  - `tests/api/core-dashboard/dashboard.smoke.test.js`

Deep invariants are not duplicated because:

- DB invariants are covered in `integration` suites; API tests remain boundary-focused (status/contract/auth/validation).

## 7️⃣ Phase 5 — Component Tests (External Adapters)

Component tests are implemented in `tests/component/**`.

Adapter mocking strategy

- External adapters are mocked at module boundaries using `vi.mock` and injected module mocks via `createApiClient`/component tests.
- Covered adapters include:
  - Mailgun (`tests/component/auth/mailgun.component.test.js`)
  - Zoom/Calendar (`tests/component/inquiry/*.test.js`)
  - Groq/fetch fallback (`tests/component/chatbot/ai-extractor.component.test.js`)
  - AWS STS/S3 (`tests/component/etl/*.test.js`)
  - Reports/PDF edges (`tests/component/core-dashboard/*.test.js`)

No-network enforcement

- Enforced globally for component suite with `tests/component/setup.js`.
- `tests/component/_helpers/noNetwork.js` blocks outbound `http`, `https`, and `fetch`.

Retry/backoff validation

- Not implemented in current phase.

Error mapping validation

- Implemented in component tests for adapter failure paths (e.g., mailgun failure, AI extractor fallback failure, report PDF generation failures).

## 8️⃣ Phase 6 — Advanced Reliability Testing

### 8.1 State Machine Validation

Implemented.

- Inquiry transitions: `src/modules/shared/inquiry/lib/inquiryTransition.utils.js` + `tests/unit/inquiry/inquiry.transition-idempotency.test.js`
- ETL upload transitions: `src/modules/shared/ETL/lib/uploadStatus.utils.js` + `tests/unit/etl/upload-status.transition.test.js`
- Chat session transitions: `src/modules/shared/chatbot/lib/sessionStatus.utils.js` + `tests/unit/chatbot/session-status.test.js`
- Auth verification transitions: `src/modules/shared/auth/lib/authTransition.utils.js` + `tests/unit/auth/auth.transition.test.js`
- Integration/API representatives exist for invalid transition paths.

### 8.2 Idempotency & Duplication Prevention

Implemented.

- Inquiry idempotency key: `src/modules/shared/inquiry/lib/inquiryIdempotency.utils.js` + unit/integration tests.
- Chat command key: `src/modules/shared/chatbot/lib/sessionStatus.utils.js` + unit tests.
- ETL duplicate submission behavior covered in API (`tests/api/etl/etl.ingest.test.js`) and DB-level ETL integration flows.

### 8.3 Multi-Tenant Isolation

Implemented.

- Shared tenant builder: `tests/helpers/tenancy.js`.
- API cross-tenant denial coverage:
  - Chatbot: `tests/api/chatbot/chatbot.tenancy.test.js`
  - ETL: `tests/api/etl/etl.tenancy.test.js`
  - Core-dashboard: `tests/api/core-dashboard/dashboard.tenancy.test.js`
- Integration scoping checks include upload ownership constraints.

### 8.4 Worker Testing

Implemented.

- Worker tick extraction: `runPollWorkerTick` in `src/modules/shared/ETL/pollOnce.js`.
- Worker decision utilities: `src/modules/shared/ETL/lib/pollWorker.utils.js`.
- Unit coverage: `tests/unit/etl/poll-worker.utils.test.js`.
- Integration DB transition coverage: `tests/integration/etl/worker-tick.integration.test.js`.

## 9️⃣ Test Isolation Strategy

DB reset strategy

- Database suites use `afterEach` truncation (`tests/setup.js` + `tests/helpers/truncate.js`).
- Truncation preserves migration metadata tables and resets identities.

Factory usage

- Deterministic fixture creation via `tests/helpers/factories.js` (sequential UUID strategy and normalized default dates).
- Tenant scenarios constructed via `tests/helpers/tenancy.js`.

Mock resets

- API app helper resets modules/mocks per test bootstrap (`vi.resetModules`, `vi.clearAllMocks`).
- Component no-network allowlist resets after each test (`resetAllowedNetworkHosts`).

Determinism guarantees

- Fixed defaults in env loader (`tests/helpers/env.js`).
- Safety guard against non-test/non-docker DB targets.
- Fake timer helpers available and used for time-sensitive rules.

Serial execution controls

- Integration/API scripts enforce one-worker serial execution on shared DB.
- Vitest config caps DB-suite concurrency by `TEST_SUITE`.

## 🔟 Design Decisions & Rationale

Real DB vs mocked repositories

- Integration suite uses real Postgres + Sequelize to validate migrations, constraints, joins, and transaction semantics that mocks cannot guarantee.

Thin API layer

- API tests assert contracts/auth/middleware and avoid re-testing deep query math, keeping suite signal high and maintenance cost lower.

Worker tick extraction

- `runPollWorkerTick` enables bounded, testable worker execution without infinite-loop harnesses, improving reliability verification and regression detection.

Tenant isolation enforcement

- Centralized tenant helpers and upload scope checks (`uploadScope.service.js`) make isolation behavior explicit and reusable across layers.

Layered taxonomy

- Distinct suite boundaries in scripts/config improve failure localization, runtime tuning, and long-term maintainability as modules evolve.

## 1️⃣1️⃣ Limitations & Future Enhancements

- No load/performance benchmarking suite is implemented.
- No dedicated concurrency stress harness for high-contention DB scenarios.
- No distributed multi-worker simulation for background processing.
- External providers are mocked in component tests; full end-to-end provider contract testing is not included.
- No dedicated CI workflow currently runs backend test stages in repository workflows.

## 1️⃣2️⃣ Engineering Outcomes

The current implementation provides layered confidence in business rules, transactional behavior, idempotency paths, tenant isolation, and worker tick reliability.  
DB-backed integration coverage and standardized API error-contract assertions improve operational safety, while deterministic setup and serial DB controls provide a stable foundation for CI execution patterns.
