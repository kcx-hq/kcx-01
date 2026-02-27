# Integration Test Plan (Phase 3)

## Auth

### Service entry points tested
- `registerAuthIdentity` (`src/modules/shared/auth/auth.service.js`)
- `getUserForClient` (`src/modules/shared/auth/auth.service.js`)
- `setPasswordResetToken` (`src/modules/shared/auth/auth.service.js`)
- `clearPasswordResetToken` (`src/modules/shared/auth/auth.service.js`)
- `verifyUserOtp` (`src/modules/shared/auth/auth.service.js`)
- `getUserCapabilitiesSnapshot` (`src/modules/shared/auth/auth.service.js`)

### Test files
- `tests/integration/auth/auth.service.test.js`
  - Creates client + user transactionally and asserts hashed password persistence.
  - Reuses existing client by normalized client email.
  - Enforces duplicate-email conflict path and DB row-count stability.
  - Verifies client-scoped user lookup success/failure behavior.
  - Persists and clears password-reset token fields.
  - Verifies OTP success/failure DB state transitions.
  - Reads capability snapshot from DB user/client linkage.

### Isolation / idempotency / rollback coverage
- Isolation: cross-client access blocked by `getUserForClient`.
- Idempotency/uniqueness: duplicate identity registration rejected.
- Rollback/unchanged state: invalid OTP and forbidden lookup keep DB rows unchanged.

### Design assumptions avoided
- No HTTP controller invocation.
- No email transport assumptions.
- No JWT internals asserted.

## Inquiry

### Service entry points tested
- `createInquiryRecord` (`src/modules/shared/inquiry/inquiry.workflow.service.js`)
- `createOrUpdatePendingInquiry` (`src/modules/shared/inquiry/inquiry.workflow.service.js`)
- `acceptInquiryByToken` (`src/modules/shared/inquiry/inquiry.workflow.service.js`)
- `rejectInquiryByToken` (`src/modules/shared/inquiry/inquiry.workflow.service.js`)
- `listInquiries` (`src/modules/shared/inquiry/inquiry.workflow.service.js`)

### Test files
- `tests/integration/inquiry/inquiry.workflow.service.test.js`
  - Creates inquiry rows with expected pending defaults.
  - Validates payload enforcement at service boundary.
  - Exercises idempotent create/update for same pending inquiry key.
  - Accepts/rejects inquiry transitions with token validation.
  - Verifies invalid token and invalid-state failures leave DB unchanged.
  - Validates status filtering, ordering, email filtering, and pagination.

### Isolation / idempotency / rollback coverage
- Isolation: query filters by status/email are enforced at SQL layer.
- Idempotency: pending inquiry upsert path updates instead of duplicating.
- Rollback/unchanged state: invalid transition paths preserve original row state.

### Design assumptions avoided
- No calendaring/email side effects asserted.
- No controller HTML responses asserted.

## Chatbot

### Service entry points tested
- `chatService.createSession` (`src/modules/shared/chatbot/chat.service.js`)
- `createSessionForClient` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `getSessionForClient` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `handleClientHelp` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `handleClientMessage` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `handleClientBack` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `handleClientConfirm` (`src/modules/shared/chatbot/chat.integration.service.js`)
- `getSessionMessages` (`src/modules/shared/chatbot/chat.integration.service.js`)

### Test files
- `tests/integration/chatbot/chat.integration.service.test.js`
  - Creates workflow sessions and verifies persisted workflow defaults.
  - Enforces client ownership for session access.
  - Persists command/message logs for help/back/invalid input flows.
  - Validates invalid payload path with AppError-shaped semantics.
  - Confirms completion flow updates session status and message log.

### Isolation / idempotency / rollback coverage
- Isolation: strict client ownership checks on session operations.
- Idempotency: repeated command paths validated for deterministic state movement.
- Rollback/unchanged state: invalid blank input keeps workflow step unchanged.

### Design assumptions avoided
- No HTTP route/controller invocation.
- No external AI network call dependency (AI key disabled in test flow).

## ETL

### Service entry points tested
- `storeDetectedColumns` (`src/modules/shared/ETL/mapping.service.js`)
- `storeAutoSuggestions` (`src/modules/shared/ETL/mapping.service.js`)
- `loadMapping` (`src/modules/shared/ETL/mapping.service.js`)
- `loadResolvedMapping` (`src/modules/shared/ETL/mapping.service.js`)
- `collectDimensions` (`src/modules/shared/ETL/dimensions/collectDimensions.js`)
- `bulkUpsertDimensions` (`src/modules/shared/ETL/dimensions/bulkUpsertDimensions.js`)
- `preloadDimensionMaps` (`src/modules/shared/ETL/dimensions/preloadDimensionsMaps.js`)
- `resolveDimensionIdsFromMaps` (`src/modules/shared/ETL/dimensions/resolveFromMaps.js`)
- `pushFact` (`src/modules/shared/ETL/fact/billingUsageFact.js`)
- `flushFacts` (`src/modules/shared/ETL/fact/billingUsageFact.js`)

### Test files
- `tests/integration/etl/etl.service.test.js`
  - Validates detected-column persistence and empty-input handling.
  - Validates suggestion persistence + auto-mapping insertion.
  - Verifies mapping resolution and client-level mapping isolation.
  - Validates dimension upsert writes and map preloading.
  - Verifies natural-key idempotency behavior on repeat dimension upsert.
  - Persists billing facts and validates numeric invariants.
  - Exercises invalid fact rows and transaction rollback behavior.
  - Runs moderate batch ingestion count/sum assertions.

### Isolation / idempotency / rollback coverage
- Isolation: mappings are loaded per `clientid`.
- Idempotency: repeat dimension upsert assertions on natural-key tables.
- Rollback/unchanged state: invalid dimension transaction is rolled back; invalid fact rows do not mutate fact count.

### Design assumptions avoided
- No CSV filesystem ingestion path.
- No cloud SDK/network path.
- No controller background-job orchestration path.

## Core-Dashboard

### Service entry points tested
- `generateCostAnalysis` (`src/modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js`)
- `getFilterDropdowns` (`src/modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js`)
- `getCostDataWithResources` (`src/modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js`)
- `buildResourceInventory` (`src/modules/core-dashboard/analytics/resources/resources.service.js`)
- `costDriversService.getCostDrivers` (`src/modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js`)
- `unitEconomicsService.getSummary` (`src/modules/core-dashboard/unit-economics/unit-economics.service.js`)

### Test files
- `tests/integration/core-dashboard/core-dashboard.service.test.js`
  - Validates `uploadIds` requirement and strict upload-scoped aggregation.
  - Validates provider filter behavior and filter dropdown derivation.
  - Validates ordered, filtered resource fact retrieval from DB.
  - Validates inventory edge-case handling (empty/new/zombie/spiking).
  - Validates cost-drivers empty shape and computed diff dynamics.
  - Validates unit-economics totals, trend rows, and drift output.

### Isolation / idempotency / rollback coverage
- Isolation: aggregation/query services scoped by `uploadIds` only.
- Idempotency: repeat analysis calls over same upload set produce stable totals.
- Rollback/unchanged state: read-only analytics paths assert no write side effects.

### Design assumptions avoided
- No API/middleware/auth handler assertions.
- No frontend contract/snapshot assertions.
