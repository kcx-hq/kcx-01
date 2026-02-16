# INGESTION_PROD_PLAN

## 1. Overview

### Ingestion Use Case
The AWS FinOps ingestion flow pulls billing export files from a client S3 bucket using cross-account role assumption, lands raw rows in a staging table, and then transforms normalized data for dashboard analytics.

### What Currently Works (Tested Manually)
- STS role assumption is working via `assumeRole.js` using environment credentials.
- S3 object fetch works for CSV and `.gz` billing files.
- CLI ingestion from `src/aws/ingest.js` inserts rows into `public.raw_aws_billing_rows`.
- Raw landing table writes are successful with `source_s3_key`, `row_data`, and `ingested_at`.
- ETL pipeline (`src/modules/shared/ETL`) loads mapped data and pushes dashboard facts using batched inserts.

## 2. Current Architecture (Test Stage)

- `STS assume role success`:
  - Uses `@aws-sdk/client-sts` with `AssumeRoleCommand`.
  - Credentials are loaded from environment variables.
- `S3 read success`:
  - Uses `@aws-sdk/client-s3` with temporary credentials returned by STS.
  - Supports gzip decompression before CSV parsing.
- `CLI ingestion script`:
  - Current entrypoint is `src/aws/ingest.js`.
  - S3 key is passed as command-line argument.
- `Raw landing to DB success`:
  - Rows are inserted into `raw_aws_billing_rows` using Sequelize model `RawAwsBillingRow`.
- `ETL to dashboard success`:
  - ETL services map, resolve dimensions, and bulk insert facts (`BillingUsageFact`) with duplicate-ignore behavior.

## 3. Requirements for Production-Ready Ingestion

- Remove hardcoded values from ingestion code.
- Make AWS roles, bucket names, prefixes, and region configurable.
- Standardize environment-based configuration with validation.
- Add robust error handling and structured logs (JSON log events).
- Implement idempotency at file-level and row-level.
- Add ingestion tracking table for status, retries, latency, and failure reasons.
- Refactor CLI flow into reusable ingestion service modules.
- Keep a worker-compatible interface for future event-driven triggers (SQS/EventBridge).

## 4. Configurable Parameters

- AWS Role ARN
- AWS bucket name
- S3 prefix
- AWS region
- Retry policy (max attempts, backoff)
- Logging level

Example `.env` contract (safe placeholders):

```env
AWS_REGION=ap-south-1
AWS_ASSUME_ROLE_ARN=arn:aws:iam::<account-id>:role/<readonly-role>
AWS_ASSUME_ROLE_SESSION_NAME=kcx-ingestion
AWS_BILLING_BUCKET=<bucket-name>
AWS_BILLING_PREFIX=demo/kcx-msu/data/
INGEST_RETRY_MAX_ATTEMPTS=3
INGEST_RETRY_BASE_DELAY_MS=500
LOG_LEVEL=info
```

Example config object:

```js
export const ingestionConfig = {
  region: process.env.AWS_REGION,
  roleArn: process.env.AWS_ASSUME_ROLE_ARN,
  roleSessionName: process.env.AWS_ASSUME_ROLE_SESSION_NAME,
  bucket: process.env.AWS_BILLING_BUCKET,
  prefix: process.env.AWS_BILLING_PREFIX,
  retry: {
    maxAttempts: Number(process.env.INGEST_RETRY_MAX_ATTEMPTS ?? 3),
    baseDelayMs: Number(process.env.INGEST_RETRY_BASE_DELAY_MS ?? 500),
  },
  logLevel: process.env.LOG_LEVEL ?? "info",
};
```

## 5. Proposed File-Structure Changes

- New ingestion service module:
  - `src/modules/ingestion/services/awsIngestion.service.js`
  - `src/modules/ingestion/services/rawLanding.service.js`
  - `src/modules/ingestion/services/ingestionTracking.service.js`
- Refactor CLI script:
  - Keep CLI entry as thin wrapper: `src/aws/ingest.cli.js`
  - Delegate all business logic to reusable services.
- Optional future worker:
  - `src/workers/awsIngestion.worker.js` for SQS/EventBridge-driven processing.

Example CLI wrapper pattern:

```js
import { runIngestionByS3Key } from "../modules/ingestion/services/awsIngestion.service.js";

const s3Key = process.argv[2];
await runIngestionByS3Key({ s3Key, source: "cli" });
```

## 6. Database Considerations

### Raw Landing Table Schema
- Existing table `raw_aws_billing_rows` is valid for initial landing.
- Recommended additions:
  - `source_bucket` (TEXT)
  - `source_etag` (TEXT)
  - `row_hash` (TEXT) for dedupe
  - Optional index on `(source_s3_key, row_hash)`

### Ingestion Metadata Tracking Table
Suggested table: `billing_ingestion_runs`

- `ingestion_run_id` (UUID, PK)
- `source_bucket` (TEXT)
- `source_s3_key` (TEXT)
- `source_etag` (TEXT)
- `status` (ENUM: pending, running, success, failed, skipped)
- `started_at`, `finished_at`
- `rows_read`, `rows_inserted`, `rows_skipped`
- `error_code`, `error_message`
- `trigger_source` (cli, api, sqs, eventbridge)

### Idempotency Strategy
- File-level idempotency:
  - Unique key on `(source_bucket, source_s3_key, source_etag)` in tracking table.
- Row-level idempotency:
  - Compute deterministic `row_hash` from normalized row payload.
  - Unique constraint on `(source_s3_key, row_hash)` or insert-ignore logic.
- Retry behavior:
  - Re-run only failed/incomplete runs with same ingestion key.

## 7. Event-Driven Integration Options

### Option A: S3 -> SQS -> Worker
- Flow:
  - S3 ObjectCreated event -> SQS -> ingestion worker -> DB.
- Pros:
  - Durable queue, retry/DLQ support, controlled concurrency.
  - Better for multi-client scale and burst handling.
- Cons:
  - More components to provision and monitor.

### Option B: S3 -> EventBridge -> Backend
- Flow:
  - S3 event -> EventBridge rule -> backend target (HTTP/Lambda/queue bridge).
- Pros:
  - Flexible routing and cross-account event rules.
  - Easy fan-out to multiple consumers.
- Cons:
  - Usually still needs queueing for heavy ingestion workloads.

### Single Client vs Multiple Clients
- Single client (low volume):
  - CLI/API + scheduled job can be sufficient initially.
- Multiple clients (higher volume):
  - Prefer SQS worker model with tenant-aware routing and per-client throttling.

## 8. Security Requirements

- IAM policies for S3 read:
  - `s3:GetObject`, `s3:ListBucket` scoped to exact billing prefixes.
- SQS access policy:
  - `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes` for worker role.
  - Queue policy allowing S3/EventBridge to publish.
- EventBridge cross-account permissions:
  - Event bus resource policy to allow producer account to put events.
- Audit and monitoring:
  - CloudTrail for role assumption and API calls.
  - CloudWatch logs/metrics/alarms for ingestion failures and retry spikes.
  - DB-level audit fields for every ingestion run.

## 9. Next Steps

### Implement First
- Extract reusable ingestion service from current CLI script.
- Introduce central ingestion config and remove hardcoded bucket/region values.
- Add `billing_ingestion_runs` table and status lifecycle.
- Add structured logging and explicit error taxonomy.

### Implement Later
- Add row-hash idempotency and stronger dedupe constraints.
- Introduce SQS worker and DLQ.
- Add EventBridge integration for multi-account event routing.

### Dependencies and Risks
- Dependencies:
  - IAM role/policy updates, DB migration support, and deployment secrets management.
- Risks:
  - Duplicate ingestion without idempotency keys.
  - Partial-file processing without transactional run tracking.
  - Operational blind spots without logs/metrics/alerts.
