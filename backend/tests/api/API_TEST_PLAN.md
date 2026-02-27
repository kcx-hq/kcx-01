# API Test Plan (Phase 4C)

## App Bootstrap Method
- `tests/helpers/apiApp.js` uses `createApiClient()` to:
  - reset module cache with `vi.resetModules()`
  - apply optional boundary mocks with `vi.doMock(...)`
  - dynamically import `createApp` from `src/app.js`
  - create a Supertest client via `tests/helpers/http.js`
- No real network port binding is used.

## Auth Fixture / Token Strategy
- `tests/helpers/authFixtures.js` seeds deterministic `User` rows using DB factories.
- It also generates deterministic client IDs for tenant scoping without relying on client-table inserts.
- Access tokens are generated via `generateJWT` with payload `{ id, role, client_id }`.
- Tests use bearer auth headers (`Authorization: Bearer <token>`).
- Login-flow tests also validate cookie-based auth continuity via `kandco_token` cookie.

## Error Contract Assertions
- `tests/helpers/apiAssertions.js` enforces:
  - status code
  - `success: false`
  - `error.code`
  - `error.message`
  - `requestId`
- It also checks no sensitive leakage (`password`, `secret`, `stack`, raw ORM internals).

## Module Coverage

### Auth
Routes tested:
- `POST /api/auth/login`
  - success shape + auth cookie contract
- `POST /api/auth/signin`
  - invalid credentials error contract
- `GET /api/auth/me`
  - protected route deny without auth
  - allow with bearer token
  - allow with login cookie (session continuity)
  - expired token handling
- `POST /internal/cloud-account-credentials`
  - deny insufficient role (`USER`)
  - allow internal role (`ADMIN`) past permission gate and assert controller validation contract

Files:
- `tests/api/auth/auth.login.test.js`
- `tests/api/auth/auth.refresh.test.js`
- `tests/api/auth/auth.protected.test.js`

### Inquiry
Routes tested:
- `POST /api/inquiry/submit`
  - success create contract (with mocked email boundary)
  - invalid payload validation contract
- `GET /api/inquiry/accept/:id`
  - not-found contract
- `GET /api/inquiry/reject/:id`
  - token mismatch forbidden contract
  - invalid transition conflict contract

Files:
- `tests/api/inquiry/inquiry.create.test.js`
- `tests/api/inquiry/inquiry.access.test.js`

### Chatbot
Routes tested:
- `POST /api/chatbot/session`
  - success contract
  - missing auth contract
- `POST /api/chatbot/message`
  - payload validation contract
  - command message success contract via `chat.service` boundary mock
  - service failure mapped to standardized API error contract

Files:
- `tests/api/chatbot/chatbot.messages.test.js`

### ETL
Routes tested:
- `POST /api/etl`
  - success ingest trigger contract (mocked `ingestBillingCsv`)
  - invalid payload contract (missing file)
  - repeated submit behavior contract (current design creates new upload)
  - processing failure mapped to internal error contract
- `GET /api/etl/get-billing-uploads`
  - auth protection contract

Files:
- `tests/api/etl/etl.ingest.test.js`

### Core-Dashboard
Routes tested:
- `GET /api/dashboard/analytics/cost-analysis/analysis`
  - unauthenticated denial
  - missing upload IDs validation contract
- `GET /api/dashboard/analytics/cost-drivers/analysis`
  - smoke response shape
- `GET /api/dashboard/analytics/resources/inventory`
  - smoke response shape
- `GET /api/dashboard/analytics/data-quality/analysis`
  - smoke response shape
- `GET /api/dashboard/overview/data-explorer`
  - pagination response shape contract
- `PUT /api/dashboard/governance/accounts/:accountId/owner`
  - invalid payload validation contract

Files:
- `tests/api/core-dashboard/dashboard.smoke.test.js`
- `tests/api/core-dashboard/dashboard.pagination.test.js`

## Not Tested At API Layer
- Deep DB invariants (FK integrity, rollback semantics, idempotent upserts): covered in integration tests.
- Pure transformation and policy logic: covered in unit tests.
- External provider internals (LLM, calendar, SMTP, cloud APIs): mocked at module boundary in API tests.
- Non-existent refresh-token endpoint behavior as a dedicated endpoint contract (repo has no `/auth/refresh` route).
