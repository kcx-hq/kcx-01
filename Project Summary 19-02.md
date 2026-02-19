# Project Summary - 19/02

## Purpose (From Scratch)
This platform is a FinOps web application that helps a client ingest cloud billing data, convert it into analysis-ready cost data, and use dashboards to monitor spend, optimization opportunities, and governance quality.

The product is designed so a new client can go from "no data connected" to "dashboard insights available" in a guided flow.

## New Client Journey (End-to-End)

### Phase 1: Client Setup and Access
1. Client user is created and signs in.
2. Platform identifies which client profile they belong to.
3. Client-specific capabilities are loaded (which dashboard modules they should see).
4. User lands on ingestion-first workflow if no billing data is active yet.

### Phase 2: Data Source Onboarding
A new client has two onboarding options:

1. CSV Upload Onboarding
- Client uploads a billing CSV file directly.
- Platform validates and accepts the file.
- Ingestion starts and upload status is tracked.

2. AWS Cloud Onboarding
- Client enters AWS account details (account, role, bucket/prefix, region).
- Platform verifies secure role access.
- Client connects successfully and opens cloud file manager.
- Client browses files in a restricted read-only data root.
- Client selects one or more billing files for ingestion.
- Ingestion starts and upload records are created.

### Phase 3: Ingestion to Processing
1. File is ingested into platform pipeline.
2. Billing fields are mapped and normalized.
3. Processed usage/cost records are written into analytics-ready storage.
4. Upload lifecycle is tracked (pending -> processing -> completed/failed).
5. Successful uploads become selectable in Billing Uploads history.

### Phase 4: Dashboard Activation
1. Client selects one or more processed uploads.
2. Selected uploads become active analysis context.
3. Client opens dashboard route assigned to their capability profile.
4. Dashboard modules load insights from the selected upload context.

### Phase 5: Ongoing Operations
- Client repeats ingestion on new billing cycles (manual or cloud-based).
- Upload history remains auditable and reusable.
- Dashboards refresh against latest selected billing periods.
- Team can compare trends and track optimization/governance over time.

## What a New Client Sees in Product Flow
- Entry: Authenticated landing and guided ingestion.
- Connect: Upload CSV or connect AWS.
- Validate: Connection/file status checks.
- Process: Background ingestion and ETL lifecycle.
- Select: Upload history workspace for analysis scope.
- Analyze: Dashboard modules for cost and governance decisions.

## High-Level Architecture (From Scratch)

### 1) Experience Layer (Frontend)
- Web app with:
  - Public pages (home, how-it-works, inquiry)
  - Auth and account flows
  - Ingestion workspace (CSV + cloud connect)
  - Upload management page
  - Dashboard surfaces (core + client-specific)
- State layer carries selected upload context into dashboards.
- Capability-aware routing sends each client to the correct dashboard route and module set.

### 2) API Layer (Backend)
- Modular API services grouped by domain:
  - Authentication and identity
  - Ingestion/ETL endpoints
  - Cloud connection endpoints
  - Capability resolution
  - Analytics and dashboard data endpoints
  - Client-specific API modules
- Middleware resolves user and client context for secure multi-tenant behavior.

### 3) Ingestion and Processing Layer
- Accepts data from two intake channels:
  - File upload channel
  - Cloud S3 selection/event channel
- Runs ingestion pipeline and mapping/normalization.
- Pushes data into analytics-serving structures.
- Tracks ingestion lifecycle and supports retry/duplicate-safe patterns.

### 4) Data Layer
- Stores:
  - User/client identity data
  - Cloud connection credentials metadata
  - Billing upload tracking records
  - Mapping metadata
  - Cost and dimension data used by dashboards
- Maintains traceability from source file -> upload record -> dashboard insights.

### 5) Multi-Client Capability Layer
- A capability profile decides:
  - Which dashboard route to open
  - Which modules are enabled
  - Which API base is used
- Supports shared platform logic with client-specific experiences (core, client-c, client-d).

## Security and Governance Posture (Functional)
- Only authenticated users access ingestion/dashboard APIs.
- Client identity is attached to protected operations.
- Cloud access uses role-based assumption rather than direct console coupling.
- Cloud file browsing is scoped to a safe logical root.
- Ingestion actions are server-controlled and auditable through upload records.

## Working Architecture Flow (Sequence View)
1. User authenticates.
2. Capability profile resolved.
3. Data ingestion initiated (CSV or AWS).
4. Upload record created.
5. Ingestion + ETL pipeline processes file.
6. Upload status finalized.
7. User selects upload context.
8. Dashboard APIs return module data under client capability scope.
9. User consumes insights and repeats cycle with next billing period.

## Outcome for a New Client
A new client can onboard, connect billing data, and start using actionable FinOps dashboards in one continuous workflow, with upload traceability, client-specific module control, and repeatable monthly/periodic ingestion operations.
