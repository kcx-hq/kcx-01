# Backend Test Inventory

All API routes below are mounted under both `/api` and `/api/v1`. Canonical paths in this inventory use `/api/v1`.

## Module: auth

### Endpoints

| METHOD | PATH | PURPOSE | AUTH? | IDENTITY CONTEXT | MODELS/TABLES |
|---|---|---|---|---|---|
| POST | /api/v1/auth/signup | Register user, create/reuse client, create verification OTP, send verification email | No (public by `defaultDenyAuth`) | Public | `User` (`users`), `Client` (`clients`) |
| POST | /api/v1/auth/login | Authenticate user, set auth cookie, return upload flag | No (public by `defaultDenyAuth`) | Public | `User` (`users`), `BillingUpload` (`billing_uploads`) |
| POST | /api/v1/auth/signin | Alias of login | No (public by `defaultDenyAuth`) | Public | `User` (`users`), `BillingUpload` (`billing_uploads`) |
| GET | /api/v1/auth/me | Return current profile, caps, upload state | Yes | `req.user.id`, `req.client_id`, `req.user.role` | `User` (`users`), `BillingUpload` (`billing_uploads`) |
| PUT | /api/v1/auth/profile | Update authenticated user profile name | Yes | `req.user.id`, `req.client_id` | `User` (`users`) |
| GET | /api/v1/auth/logout | Clear auth cookie | Yes | `req.user.id` | None |
| POST | /api/v1/auth/verify | Verify email OTP | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |
| POST | /api/v1/auth/verify-email | Alias of verify email OTP | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |
| POST | /api/v1/auth/reset | Start forgot-password flow | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |
| POST | /api/v1/auth/forgot-password | Alias of forgot-password flow | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |
| POST | /api/v1/auth/reset/:token | Reset password with token | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |
| POST | /api/v1/auth/reset-password/:token | Alias of reset password with token | No (public by `defaultDenyAuth`) | Public | `User` (`users`) |

### Flows

| FLOW NAME | DESCRIPTION | SOURCE-OF-TRUTH LAYER (unit/integration/api) | NOTES |
|---|---|---|---|
| Signup new account | Normalize email, create/reuse client, create unverified user + OTP, send verification email | integration | DB invariants on `users`/`clients` and OTP fields |
| Signup existing unverified | Reissue OTP and resend verification instead of creating duplicate user | integration | Conflict behavior differs by verification state |
| Signup existing verified conflict | Reject duplicate verified account | integration | Must return `409` conflict path |
| Signin verified success | Password check + JWT cookie + hasUploaded flag | api | API boundary owns cookie and response contract checks |
| Signin unverified user | Reissue OTP and reject access | api | Confirms `403` boundary and standardized error mapping |
| Verify email OTP | Validate OTP + expiry and mark user verified | integration | State transition on `users` row |
| Forgot password token issue | Generate hash, persist token+expiry, send reset email | integration | Token lifecycle and anti-enumeration response shape |
| Reset password by token | Validate token hash and expiry, rotate password hash, clear token fields | integration | Password mutation through model hooks |
| Authenticated profile fetch/update | Read/update user profile for current identity only | api | Auth boundary + profile contract |

### Not at API

- Password hashing internals and `beforeCreate`/`beforeUpdate` hook behavior.
- OTP/token expiry edge permutations across clock windows.
- Duplicate/uniqueness and persistence invariants on `users`/`clients`.
- Email sender implementation details and template rendering internals.

### Definition of Done (Top 3)

1. `POST /api/v1/auth/signup` (source layer: `integration`)
- Happy path: new user and client row persisted, OTP fields set.
- Auth/tenant isolation: not applicable (public endpoint).
- Validation failure: missing/invalid email or required fields returns `400`.
- Not found/conflict: existing verified user returns `409`.
- AppError mapping: failures map to standardized error envelope.

2. `POST /api/v1/auth/login` (source layer: `api`)
- Happy path: returns `200`, sets `kandco_token`, includes user payload and `hasUploaded`.
- Auth/tenant isolation: not applicable (public endpoint), invalid creds return `401`.
- Validation failure: missing credentials returns `400`.
- Not found/conflict: user missing or bad password returns `401`; unverified returns `403`.
- AppError mapping: standardized error envelope on failures.

3. `GET /api/v1/auth/me` (source layer: `api`)
- Happy path: returns current user, caps, and upload state for authenticated identity.
- Auth/tenant isolation: missing/invalid JWT returns `401`; response tied to `req.user.id`/`req.client_id`.
- Validation failure: not applicable.
- Not found/conflict: missing user returns `404`.
- AppError mapping: standardized error envelope on failures.

## Module: inquiry

### Endpoints

| METHOD | PATH | PURPOSE | AUTH? | IDENTITY CONTEXT | MODELS/TABLES |
|---|---|---|---|---|---|
| POST | /api/v1/inquiry/submit | Create inquiry and send company/client emails | Yes (global `defaultDenyAuth`) | JWT identity present; flow primarily uses payload fields | `Inquiry` (`inquiries`) |
| GET | /api/v1/inquiry/accept/:id | Accept inquiry via tokenized link and schedule meeting | Yes (global `defaultDenyAuth`) | JWT identity + `token` query + inquiry id | `Inquiry` (`inquiries`) |
| GET | /api/v1/inquiry/reject/:id | Reject inquiry via tokenized link | Yes (global `defaultDenyAuth`) | JWT identity + `token` query + inquiry id | `Inquiry` (`inquiries`) |
| GET | /api/v1/inquiry/slots/by-date | Return available meeting slots for date/timezone | Yes (global `defaultDenyAuth`) | JWT identity + query (`date`, `userTimezone`, `slotMinutes`) | No DB write; calendar provider integration |

### Flows

| FLOW NAME | DESCRIPTION | SOURCE-OF-TRUTH LAYER (unit/integration/api) | NOTES |
|---|---|---|---|
| Submit inquiry | Persist inquiry in `PENDING`, generate action token, send acknowledgment + internal notification | integration | DB + token persistence path |
| Accept inquiry | Validate token/status/id, schedule event, mark inquiry `ACCEPTED`, attach meet link | integration | State transition with external scheduler side effect |
| Reject inquiry | Validate token/status/id, mark inquiry `REJECTED`, send rejection email | integration | Conflict handling for already-processed inquiry |
| Availability slot generation | Convert date window between business TZ and user TZ, return free slots | unit | Pure date/time transformation and slot-shape checks with provider mocked |
| Inquiry idempotency guard | Reject repeat accept/reject on non-`PENDING` inquiry | integration | Must return `409` on already-processed inquiries |

### Not at API

- Calendar provider scheduling internals and availability retrieval algorithms.
- Email template rendering and transport details.
- Token verification cryptographic details.
- Full timezone matrix and daylight boundary permutations.

### Definition of Done (Top 3)

1. `POST /api/v1/inquiry/submit` (source layer: `integration`)
- Happy path: inquiry row created, status `PENDING`, action token persisted.
- Auth/tenant isolation: unauthenticated request blocked with `401`.
- Validation failure: missing `preferred_datetime` or `timezone` returns `400`.
- Not found/conflict: not applicable.
- AppError mapping: standardized error envelope on failures.

2. `GET /api/v1/inquiry/accept/:id` (source layer: `integration`)
- Happy path: valid token schedules event and updates status to `ACCEPTED`.
- Auth/tenant isolation: unauthenticated request blocked with `401`.
- Validation failure: missing token returns `400`.
- Not found/conflict: missing inquiry returns `404`, non-`PENDING` status returns `409`.
- AppError mapping: standardized error envelope for failure paths.

3. `GET /api/v1/inquiry/slots/by-date` (source layer: `unit`)
- Happy path: valid date returns normalized slot structure.
- Auth/tenant isolation: unauthenticated request blocked with `401` in API boundary tests.
- Validation failure: missing date returns `400`.
- Not found/conflict: not applicable.
- AppError mapping: standardized error envelope for provider failures.

## Module: chatbot

### Endpoints

| METHOD | PATH | PURPOSE | AUTH? | IDENTITY CONTEXT | MODELS/TABLES |
|---|---|---|---|---|---|
| POST | /api/v1/chatbot/session | Create chatbot session and return first step prompt | Yes (global `defaultDenyAuth`) | JWT identity present; current implementation does not branch on identity | `ChatSession` (`chat_sessions`) |
| GET | /api/v1/chatbot/session/:sessionId | Fetch session state snapshot | Yes (global `defaultDenyAuth`) | JWT identity present; `sessionId` path param | `ChatSession` (`chat_sessions`) |
| POST | /api/v1/chatbot/message | Process commands/messages and progress flow state | Yes (global `defaultDenyAuth`) | JWT identity present; body includes `sessionId`, `message` | `ChatSession` (`chat_sessions`), `ChatMessage` (`chat_messages`) |

### Flows

| FLOW NAME | DESCRIPTION | SOURCE-OF-TRUTH LAYER (unit/integration/api) | NOTES |
|---|---|---|---|
| Session bootstrap | New session starts at `step_index=0` and `status=active` | integration | Persistence semantics |
| Session retrieval | Existing session returns computed step/progress snapshot | api | Contract boundary and `404` behavior |
| Command routing | `help/back/skip/summary/restart/confirm` mapped to dedicated handlers | api | Endpoint routing and command dispatch correctness |
| Strict input validation | Step-mode validation (`yes_no`, `email`, budget formats, list parsing) | unit | Deterministic validation rules |
| Step transition transaction | On message, write user+bot messages and update requirements/step atomically | integration | Transaction rollback on failure |
| Summary jump | `summary` command returns recap and moves pointer to `schedule_meeting` step | integration | State movement and summary structure |
| Restart flow | Reset session requirements, step index, and status | integration | Idempotent reset semantics |
| Confirm gating | `confirm` finalizes only at done step; otherwise treated as normal input | integration | Prevents premature completion |

### Not at API

- Low-level transaction commit/rollback behavior.
- AI extraction internals and clarification heuristics.
- Random acknowledgment selection distribution.
- Deep persistence checks for each command branch.

### Definition of Done (Top 3)

1. `POST /api/v1/chatbot/session` (source layer: `api`)
- Happy path: returns `sessionId`, first question, step metadata.
- Auth/tenant isolation: unauthenticated request blocked with `401`.
- Validation failure: not applicable for empty body.
- Not found/conflict: not applicable.
- AppError mapping: failure path standardized.

2. `POST /api/v1/chatbot/message` state progression (source layer: `integration`)
- Happy path: user message persisted, bot reply persisted, session step increments.
- Auth/tenant isolation: unauthenticated request blocked with `401` in API boundary test.
- Validation failure: missing `sessionId`/`message` returns `400`.
- Not found/conflict: unknown session returns `404`.
- AppError mapping: standardized error envelope on handler failures.

3. `POST /api/v1/chatbot/message` confirm gating (source layer: `integration`)
- Happy path: `confirm` completes only when current step is done.
- Auth/tenant isolation: same as message endpoint.
- Validation failure: invalid input type handled with `400`.
- Not found/conflict: unknown session returns `404`.
- AppError mapping: standardized error envelope for unexpected failures.

## Module: etl

### Endpoints

| METHOD | PATH | PURPOSE | AUTH? | IDENTITY CONTEXT | MODELS/TABLES |
|---|---|---|---|---|---|
| POST | /api/v1/etl/ | Upload billing CSV and run ingestion pipeline | Yes | `req.user.id`, `req.client_id` | `BillingUpload` (`billing_uploads`), `BillingUsageFact` (`billing_usage_fact`), dimension tables (`cloud_accounts`, `services`, `regions`, `skus`, `resources`, `sub_accounts`, `commitment_discounts`), mapping tables |
| GET | /api/v1/etl/get-billing-uploads | List billing uploads for current client | Yes | `req.client_id` | `BillingUpload` (`billing_uploads`) |
| POST | /api/v1/etl/s3-ingest | Validate signed ingest event, dedupe, create upload, trigger background ETL | Yes (`defaultDenyAuth`) + HMAC | `req.user.id`, `req.client_id`, HMAC headers, account/region from payload | `CloudAccountCredentials` (`cloud_account_credentials`), `BillingUpload` (`billing_uploads`), ingestion writes facts/dimensions |

### Flows

| FLOW NAME | DESCRIPTION | SOURCE-OF-TRUTH LAYER (unit/integration/api) | NOTES |
|---|---|---|---|
| CSV upload validation | Reject missing multipart file and invalid request shape | api | Endpoint contract and `400` path |
| Upload lifecycle transitions | Persist upload state `PENDING -> PROCESSING -> COMPLETED` | integration | Core ingestion lifecycle invariant |
| Upload failure handling | On ETL error, mark upload `FAILED` and preserve deterministic failure state | integration | Must not leave `PROCESSING` hanging |
| Client-scoped upload listing | Return only uploads for authenticated client | integration | Tenant isolation over `clientid` |
| S3 event payload validation | Validate account, region, bucket, key, size, replay/signature headers | api | Boundary security checks |
| Credential gate for S3 ingest | Require valid `CloudAccountCredentials` for client/account | integration | Reject unauthorized ingestion |
| Dedupe behavior | Ignore duplicate S3 object ingest by checksum/etag+sequencer fingerprint | integration | Idempotency guarantee |
| Background ingest orchestration | Return `202` quickly and process ETL asynchronously with status updates | integration | Verifies eventual status transitions |
| Mapping and dimension upserts | Resolve detected columns/mappings and upsert dimensions before fact writes | integration | Query correctness and referential consistency |

### Not at API

- CSV parsing permutations and mapping heuristics exhaustive matrix.
- Bulk upsert conflict strategy and dedupe internals.
- Fact-table aggregation correctness and referential joins.
- Background job timing/race behavior beyond contract-level `202`.

### Definition of Done (Top 3)

1. `POST /api/v1/etl/` (source layer: `integration`)
- Happy path: file accepted, upload row progresses to `COMPLETED`.
- Auth/tenant isolation: unauthenticated request blocked with `401`; upload tied to `req.client_id`.
- Validation failure: missing file returns `400`.
- Not found/conflict: not applicable.
- AppError mapping: ingestion failures map to standardized envelope with `500`.

2. `GET /api/v1/etl/get-billing-uploads` (source layer: `integration`)
- Happy path: returns only client-scoped uploads.
- Auth/tenant isolation: unauthenticated request blocked with `401`; no cross-client leakage.
- Validation failure: not applicable.
- Not found/conflict: not applicable.
- AppError mapping: standardized error envelope on repository failures.

3. `POST /api/v1/etl/s3-ingest` (source layer: `api`)
- Happy path: valid signed payload returns `202` with accepted status.
- Auth/tenant isolation: invalid/missing JWT or HMAC data rejected.
- Validation failure: malformed payload or key fields return `400`.
- Not found/conflict: missing credentials or prefix/permission mismatch rejects with authorization failure; duplicate payload returns deterministic success response.
- AppError mapping: standardized error envelope on auth/validation/internal failures.

## Module: core-dashboard

### Endpoints

| METHOD | PATH | PURPOSE | AUTH? | IDENTITY CONTEXT | MODELS/TABLES |
|---|---|---|---|---|---|
| GET | /api/v1/dashboard/overview | Top-level overview metrics for selected uploads/filters | Yes | JWT user; `uploadId`/`uploadIds`; fallback to user uploads in controller paths | `BillingUsageFact` (`billing_usage_fact`) + joined dimensions |
| GET | /api/v1/dashboard/overview/anomalies | Cost anomaly analysis | Yes | JWT user; upload scoping required | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/overview/filters | Filter options for dashboard views | Yes | JWT user; upload scoping | `BillingUsageFact`, `CloudAccount`, `Service`, `Region` |
| GET | /api/v1/dashboard/overview/data-explorer | Paginated/filterable data explorer rows | Yes | JWT user; upload scoping | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/overview/data-explorer/export-csv | CSV export for data explorer filters | Yes | JWT user; upload scoping | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/reports/summary | Report summary metrics for period/filters | Yes | JWT user; upload scoping | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/reports/top-services | Top services by spend | Yes | JWT user; upload scoping | `BillingUsageFact`, `Service` |
| GET | /api/v1/dashboard/reports/top-regions | Top regions by spend | Yes | JWT user; upload scoping | `BillingUsageFact`, `Region` |
| GET | /api/v1/dashboard/reports/monthly-spend | Monthly spend trend | Yes | JWT user; upload scoping | `BillingUsageFact` |
| GET | /api/v1/dashboard/reports/tag-compliance | Tag compliance metrics | Yes | JWT user; upload scoping | `BillingUsageFact` (JSON tags) |
| GET | /api/v1/dashboard/reports/environment-breakdown | Production vs non-production split | Yes | JWT user; upload scoping | `BillingUsageFact` |
| POST | /api/v1/dashboard/reports/download | Generate PDF-style report payload/download | Yes | JWT user; upload scoping | Report data sourced from `BillingUsageFact` aggregations |
| GET | /api/v1/dashboard/optimization/recommendations | Consolidated optimization recommendations | Yes | JWT user; upload scoping (fallback by user uploads) | `BillingUsageFact`, `Service`, `Region`, `Resource` |
| GET | /api/v1/dashboard/optimization/idle-resources | Idle resource detection | Yes | JWT user; upload scoping | `BillingUsageFact`, `Resource` |
| GET | /api/v1/dashboard/optimization/opportunities | Opportunity summary for savings | Yes | JWT user; upload scoping | `BillingUsageFact`, `Service`, `Resource` |
| GET | /api/v1/dashboard/optimization/commitments | Commitment gap insights | Yes | JWT user; upload scoping | `BillingUsageFact`, `CommitmentDiscount` |
| GET | /api/v1/dashboard/optimization/tracker | Action tracker items | Yes | JWT user; upload scoping | `BillingUsageFact`-derived optimization datasets |
| GET | /api/v1/dashboard/optimization/right-sizing | Right-sizing recommendations | Yes | JWT user; upload scoping | `BillingUsageFact`, `Service`, `Resource` |
| GET | /api/v1/dashboard/governance/summary | Governance summary and risk posture | Yes | JWT user; upload scoping | `BillingUsageFact`, `CloudAccount` |
| GET | /api/v1/dashboard/governance/compliance | Governance compliance details | Yes | JWT user; upload scoping | `BillingUsageFact` |
| GET | /api/v1/dashboard/governance/accounts | Accounts ownership rollup | Yes | JWT user; upload scoping | `BillingUsageFact`, `CloudAccount` |
| PUT | /api/v1/dashboard/governance/accounts/:accountId/owner | Update inferred owner for account-level governance | Yes | JWT user; upload scoping + account id | `CloudAccount`, `BillingUsageFact` (tags/owner updates) |
| GET | /api/v1/dashboard/analytics/cost-analysis/analysis | Cost trend and grouping analytics | Yes | JWT user; explicit `uploadId`/`uploadIds` required | `BillingUsageFact`, `CloudAccount`, `Service`, `Region`, `Resource` |
| GET | /api/v1/dashboard/analytics/cost-analysis/filters | Cost analysis filter options | Yes | JWT user; upload scoping | `BillingUsageFact`, `CloudAccount`, `Service`, `Region` |
| GET | /api/v1/dashboard/analytics/cost-drivers/test | Route health check for cost-drivers router | Yes | JWT user | None |
| GET | /api/v1/dashboard/analytics/cost-drivers/analysis | Driver-level change analysis | Yes | JWT user; upload scoping | `BillingUsageFact` + dimensions |
| POST | /api/v1/dashboard/analytics/cost-drivers/details | Details for selected driver | Yes | JWT user; upload scoping + driver body payload | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/analytics/data-quality/analysis | Data quality diagnostics | Yes | JWT user; upload scoping | `BillingUsageFact` + dimensions |
| GET | /api/v1/dashboard/analytics/resources/inventory | Resource inventory aggregation and KPIs | Yes | JWT user; upload scoping | `BillingUsageFact`, `Resource`, `Service`, `Region`, `CloudAccount` |
| GET | /api/v1/dashboard/unit-economics/summary | Unit economics KPIs from cost and quantity | Yes | JWT user; upload scoping | `BillingUsageFact`, `Service`, `Region`, `CloudAccount` |

### Flows

| FLOW NAME | DESCRIPTION | SOURCE-OF-TRUTH LAYER (unit/integration/api) | NOTES |
|---|---|---|---|
| Upload scope normalization | Normalize `uploadId`/`uploadIds` from query/body and enforce scoped queries | integration | Prevents unscoped global reads |
| Overview metrics aggregation | Compute headline metrics from usage facts and selected filters | integration | Repository/query correctness |
| Overview anomalies pipeline | Detect unusual spend changes and return anomaly payload | integration | Time-window and grouping correctness |
| Data explorer retrieval/export | Query raw/normalized rows and export CSV using same filters | integration | Deterministic filter parity between list/export |
| Reports suite aggregation | Summary, top services/regions, monthly, tag compliance, env split | integration | Financial aggregation invariants |
| Optimization recommendation engine | Idle, opportunities, right-sizing, commitments, tracker composition | unit | Rule calculations and scoring are deterministic |
| Governance ownership analysis | Compliance and ownership gaps computed from billing/tag data | integration | Resource/account-level grouping correctness |
| Governance owner mutation | `PUT` owner update applies only to scoped account + uploads | integration | Safe mutation and account existence checks |
| Analytics modules orchestration | Cost analysis, cost drivers, data quality, resources inventory contracts | api | Route contracts, validation boundaries, auth boundaries |
| Unit economics summary | Convert cost/consumption facts into normalized unit-economic KPIs | integration | Numeric invariants and edge-case handling |

### Not at API

- Detailed SQL/ORM aggregation semantics and numeric edge validation.
- Full matrix of filter combinations across each dashboard endpoint.
- Recommendation algorithm internals (idle/right-size/commitment heuristics).
- Data explorer grouping/pivot math and CSV row-shaping internals.
- Repository-level upload isolation invariants and join correctness.

### Definition of Done (Top 3)

1. `GET /api/v1/dashboard/overview` (source layer: `api`)
- Happy path: returns overview payload for valid scoped uploads.
- Auth/tenant isolation: unauthenticated request blocked with `401`; scoped data only.
- Validation failure: invalid period/filter input returns `400`.
- Not found/conflict: no uploads selected returns deterministic empty/no-data response contract.
- AppError mapping: standardized error envelope for failures.

2. `GET /api/v1/dashboard/analytics/cost-analysis/analysis` (source layer: `integration`)
- Happy path: returns analysis dataset when `uploadIds` supplied.
- Auth/tenant isolation: API boundary blocks unauthenticated calls; integration ensures scoped query only.
- Validation failure: missing upload scope returns `400`.
- Not found/conflict: not applicable.
- AppError mapping: standardized error envelope for service/repository failures.

3. `PUT /api/v1/dashboard/governance/accounts/:accountId/owner` (source layer: `integration`)
- Happy path: owner updated for account facts within selected uploads.
- Auth/tenant isolation: unauthenticated request blocked with `401`; mutation scoped by upload ids.
- Validation failure: missing `owner` or missing upload scope returns `400`.
- Not found/conflict: unknown account yields not-found behavior.
- AppError mapping: standardized error envelope on errors.
