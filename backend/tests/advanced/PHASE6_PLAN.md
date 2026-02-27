# Phase 6 Advanced Test Plan

## State Machines Found

### Inquiry
- Source: `src/modules/shared/inquiry/lib/inquiryTransition.utils.js`
- States: `PENDING`, `ACCEPTED`, `REJECTED`
- Transition table:
  - `PENDING -> ACCEPTED` allowed
  - `PENDING -> REJECTED` allowed
  - `ACCEPTED -> ACCEPTED` idempotent allowed
  - `REJECTED -> REJECTED` idempotent allowed
  - `ACCEPTED -> REJECTED` conflict
  - `REJECTED -> ACCEPTED` conflict
- Tests:
  - Unit: `tests/unit/inquiry/inquiry.transition-idempotency.test.js`
  - Integration rollback: `tests/integration/inquiry/inquiry.idempotency.test.js`
  - API invalid transition (existing): `tests/api/inquiry/inquiry.access.test.js`

### ETL Upload Status
- Source: `src/modules/shared/ETL/lib/uploadStatus.utils.js`
- States: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- Transition table:
  - `PENDING -> PROCESSING` allowed
  - `PROCESSING -> COMPLETED` allowed
  - `PROCESSING -> FAILED` allowed
  - `COMPLETED -> PROCESSING` conflict
  - `FAILED -> COMPLETED` conflict
- Tests:
  - Unit: `tests/unit/etl/upload-status.transition.test.js`
  - Integration rollback/idempotency: `tests/integration/etl/upload-status.service.test.js`

### Chat Session Status
- Source: `src/modules/shared/chatbot/lib/sessionStatus.utils.js`
- States: `active`, `completed`, `abandoned`
- Transition table:
  - `active -> completed` allowed
  - `completed -> active` allowed
  - `abandoned -> active` allowed
  - `abandoned -> completed` conflict
  - `completed -> abandoned` conflict
- Tests:
  - Unit: `tests/unit/chatbot/session-status.test.js`
  - Integration rollback/valid transition: `tests/integration/chatbot/chat.session-state.test.js`
  - API invalid transition: `tests/api/chatbot/chatbot.transition.test.js`

### Auth Verification
- Source: `src/modules/shared/auth/lib/authTransition.utils.js`
- States: `UNVERIFIED`, `VERIFIED`
- Transition table:
  - `UNVERIFIED -> VERIFIED` allowed
  - `VERIFIED -> VERIFIED` idempotent allowed
  - `VERIFIED -> UNVERIFIED` invalid
- Tests:
  - Unit: `tests/unit/auth/auth.transition.test.js`
  - Integration rollback: `tests/integration/auth/auth.verification-transition.test.js`
  - API invalid transition: `tests/api/auth/auth.verify-transition.test.js`

## Idempotency Keys Found

- Inquiry pending command key:
  - Source: `src/modules/shared/inquiry/lib/inquiryIdempotency.utils.js`
  - Function: `buildPendingInquiryKey`
  - Unit tests: `tests/unit/inquiry/inquiry.transition-idempotency.test.js`
  - Integration double-apply: `tests/integration/inquiry/inquiry.idempotency.test.js`

- Auth identity key:
  - Source: `src/modules/shared/auth/auth.utils.js`
  - Function: `buildAuthIdentityKey`
  - Unit tests: `tests/unit/auth/auth.transition.test.js`

- Chat message command key:
  - Source: `src/modules/shared/chatbot/lib/sessionStatus.utils.js`
  - Function: `buildChatMessageCommandKey`
  - Unit tests: `tests/unit/chatbot/session-status.test.js`

## Tenancy Helper API

- Source: `tests/helpers/tenancy.js`
- Function: `createTwoTenantScenario(options?)`
- Returns:
  - `tenantA`: `{ client, user, token, authHeaders }`
  - `tenantB`: `{ client, user, token, authHeaders }`
- Usage examples:
  - Chatbot cross-tenant API isolation: `tests/api/chatbot/chatbot.tenancy.test.js`
  - Core-dashboard cross-tenant API isolation: `tests/api/core-dashboard/dashboard.tenancy.test.js`
  - ETL cross-tenant API isolation: `tests/api/etl/etl.tenancy.test.js`

## Worker Tick Entry Points

- Tick processor:
  - Source: `src/modules/shared/ETL/pollOnce.js`
  - Function: `runPollWorkerTick({ now, integrationModel, pollClientFn, loggerInstance })`
  - Behavior:
    - Selects enabled integrations
    - Sorts deterministically by `lastpolledat`, then `id`
    - Calls `pollClient` once per integration
    - On success: sets `lastpolledat`, clears `lasterror`
    - On failure: sets `lasterror`, continues processing remaining integrations

- Worker decision helpers:
  - Source: `src/modules/shared/ETL/lib/pollWorker.utils.js`
  - Functions:
    - `isPollCandidate`
    - `sortIntegrationsForPolling`
    - `buildPollJobPayload`
    - `computeWorkerSleepMs`
    - `toWorkerErrorMessage`

- Tests:
  - Unit: `tests/unit/etl/poll-worker.utils.test.js`
  - Integration DB transitions: `tests/integration/etl/worker-tick.integration.test.js`

## New Tests Added By Module

### Auth
- Unit:
  - `tests/unit/auth/auth.transition.test.js`
- Integration:
  - `tests/integration/auth/auth.verification-transition.test.js`
- API:
  - `tests/api/auth/auth.verify-transition.test.js`

### Inquiry
- Unit:
  - `tests/unit/inquiry/inquiry.transition-idempotency.test.js`
- Integration:
  - `tests/integration/inquiry/inquiry.idempotency.test.js`
- API:
  - Reused existing invalid transition coverage in `tests/api/inquiry/inquiry.access.test.js`

### Chatbot
- Unit:
  - `tests/unit/chatbot/session-status.test.js`
- Integration:
  - `tests/integration/chatbot/chat.session-state.test.js`
- API:
  - `tests/api/chatbot/chatbot.transition.test.js`
  - `tests/api/chatbot/chatbot.tenancy.test.js`

### ETL
- Unit:
  - `tests/unit/etl/upload-status.transition.test.js`
  - `tests/unit/etl/poll-worker.utils.test.js`
- Integration:
  - `tests/integration/etl/upload-status.service.test.js`
  - `tests/integration/etl/worker-tick.integration.test.js`
- API:
  - `tests/api/etl/etl.tenancy.test.js`
  - Existing idempotency behavior coverage kept in `tests/api/etl/etl.ingest.test.js`

### Core-Dashboard
- Unit:
  - `tests/unit/core-dashboard/upload-scope.utils.test.js`
- Integration:
  - `tests/integration/core-dashboard/upload-scope.integration.test.js`
- API:
  - `tests/api/core-dashboard/dashboard.tenancy.test.js`
