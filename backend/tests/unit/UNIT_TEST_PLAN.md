# Unit Test Plan (Phase 2)

## auth

### Target Functions
- `backend/src/modules/shared/auth/auth.utils.js`
  - `normalizeEmail`
  - `resolveClientEmail`
  - `deriveClientName`
  - `isValidProfileName`
  - `buildAuthPayload`
  - `getCapabilitiesForClient`
  - `canRolePerform`
  - Why unit-testable: pure input/output transformations and policy checks, no IO.
  - Dependencies to mock: none.
- `backend/src/utils/jwt.js`
  - `generateJWT`
  - `verifyJWT`
  - Why unit-testable: wrapper contracts around library calls.
  - Dependencies to mock: `jsonwebtoken`, env (`JWT_SECRET`, `JWT_EXPIRES_IN`).

### Test File Mapping
- `backend/tests/unit/auth/auth.utils.test.js`
- `backend/tests/unit/auth/jwt.test.js`

### Covered
- Email/client normalization rules.
- Client-name derivation fallback rules.
- Role-policy checks and capability fallback.
- JWT wrapper argument contract and fallback expiration behavior.

### Not Covered
- Controller handlers (`signUp`, `signIn`, etc.) because they include DB, cookie, and mail side effects.
- `jsonwebtoken` cryptographic internals.

## inquiry

### Target Functions
- `backend/src/modules/shared/inquiry/inquiry.utils.js`
  - `hasRequiredInquirySubmitFields`
  - `buildInquiryActionLinks`
  - `validateInquiryActionState`
  - `buildBusinessDayWindow`
  - `toUtcIsoRange`
  - `resolveViewerTimezone`
  - `formatSlotsForViewer`
  - Why unit-testable: deterministic validation/state/time conversion logic with no network/DB.
  - Dependencies to mock: system time for window logic.

### Test File Mapping
- `backend/tests/unit/inquiry/inquiry.utils.test.js`

### Covered
- Required-field validation.
- Action-link composition.
- Inquiry action state machine preconditions with `AppError` fields.
- Business-window rounding/clamping with frozen time.
- UTC range conversion and viewer-timezone slot formatting.

### Not Covered
- Calendar API scheduling and free-slot retrieval (external integration).
- Inquiry persistence and mail side effects.

## chatbot

### Target Functions
- `backend/src/modules/shared/chatbot/chat.rules.js`
  - `formatConfirmValue`
  - `looksLikeProjectContent`
  - `validateStrict`
  - `validateChatInput`
  - Why unit-testable: rule engine and input validation logic, no IO.
  - Dependencies to mock: none.
- `backend/src/modules/shared/chatbot/deepSet.js`
  - `setDeep`
  - Why unit-testable: pure object mutation utility.
  - Dependencies to mock: none.
- `backend/src/modules/shared/chatbot/flowHelpers.js`
  - `getCurrentStep`
  - `formatSummary`
  - `buildSessionResponse`
  - Why unit-testable: deterministic response and summary shaping.
  - Dependencies to mock: none.

### Test File Mapping
- `backend/tests/unit/chatbot/chat.rules.test.js`
- `backend/tests/unit/chatbot/deepSet.test.js`
- `backend/tests/unit/chatbot/flowHelpers.test.js`

### Covered
- Strict validation branches (`yes_no`, `email`, `budget_or_not_sure`).
- Empty/list input guardrails.
- Deep nested assignment behavior.
- Session response/progress shaping and summary label/value normalization.

### Not Covered
- DB transaction flows in `chat.service.js`.
- AI extractor behavior and provider API behavior.

## etl

### Target Functions
- `backend/src/modules/shared/ETL/provider-detect.service.js`
  - `detectProvider`
  - Why unit-testable: header classification logic only.
  - Dependencies to mock: none.
- `backend/src/modules/shared/ETL/lib/mapping.utils.js`
  - `resolveMapping`
  - Why unit-testable: source-to-target mapping resolution without IO.
  - Dependencies to mock: none.
- `backend/src/modules/shared/ETL/lib/s3Ingest.utils.js`
  - `toSafeString`
  - `validateS3BucketName`
  - `validateAwsRegion`
  - `normalizeS3ObjectKey`
  - `parseAndValidateS3IngestPayload`
  - `buildS3IngestFingerprint`
  - Why unit-testable: deterministic parsing/validation/idempotency-key rules.
  - Dependencies to mock: none.
- `backend/src/modules/shared/ETL/dimensions/resolveFromMaps.js`
  - `resolveDimensionIdsFromMaps`
  - Why unit-testable: map lookup resolution only.
  - Dependencies to mock: none.

### Test File Mapping
- `backend/tests/unit/etl/provider-detect.service.test.js`
- `backend/tests/unit/etl/mapping.utils.test.js`
- `backend/tests/unit/etl/s3Ingest.utils.test.js`
- `backend/tests/unit/etl/resolveFromMaps.test.js`

### Covered
- Cloud provider detection rules.
- Header normalization and mapping resolution rules.
- S3 payload validation constraints and object-key normalization.
- Deterministic dedupe fingerprint generation.
- Dimension ID resolution from preloaded maps.

### Not Covered
- File ingestion pipeline, bulk upserts, and DB writes.
- S3 client calls and background ingestion orchestration.

## core-dashboard

### Target Functions
- `backend/src/modules/core-dashboard/utils/uploadIds.utils.js`
  - `normalizeUploadIds`
  - `extractUploadIdsFromRequest`
  - `extractUploadIdsBodyFirst`
  - Why unit-testable: request parsing/normalization rules with no IO.
  - Dependencies to mock: none.
- `backend/src/modules/core-dashboard/analytics/resources/resources.service.js`
  - `buildResourceInventory`
  - Why unit-testable: pure aggregation/formula/status/label shaping logic.
  - Dependencies to mock: none.

### Test File Mapping
- `backend/tests/unit/core-dashboard/uploadIds.utils.test.js`
- `backend/tests/unit/core-dashboard/resources.service.test.js`

### Covered
- Upload-id extraction precedence and normalization behavior.
- Resource-level aggregation and cost summation.
- Status classification (`Active`, `Zombie`, `New`, `Spiking`).
- Tag coverage metrics and inventory sorting.
- Stat rollups for totals and category-specific costs.

### Not Covered
- Repository queries, joins, and upload-scope DB enforcement.
- Controller middleware/auth behavior and HTTP contract edges.
