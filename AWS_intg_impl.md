# KCX – AWS Billing Data Ingestion Architecture

**Scope-Limited | No Kafka | No Flink**

## 1. Purpose

This document defines how KCX ingests recurring AWS billing data from a client’s AWS account into KCX’s raw database in a secure, professional, and auditable manner.

This architecture focuses only on ingestion. Downstream processing and streaming are out of scope.

## 2. Problem Statement

Clients using AWS generate billing data periodically (hourly/daily). This data is exported by AWS as immutable billing files stored in the client’s S3 bucket.

KCX must:

- Access this data securely.
- Ingest it incrementally.
- Avoid local file storage.
- Preserve raw data for auditing.
- Operate without manual intervention.

## 3. High-Level Architecture
yr
```mermaid
flowchart LR
  subgraph CLIENT[Client AWS Account]
    BE[AWS Billing Export]
    S3[S3 Bucket\n(billing files, append-only)]
    BE --> S3
  end

  subgraph KCX[KCX Platform]
    ING[Ingestion Service]
    RAW[Raw Billing Database]
    API[API / Dashboard]
    ING --> RAW --> API
  end

  S3 -->|Read-only cross-account access| ING

  classDef client fill:#eef2ff,stroke:#4f46e5,stroke-width:1px,color:#111827;
  classDef kcx fill:#ecfeff,stroke:#06b6d4,stroke-width:1px,color:#111827;
  classDef core fill:#ffffff,stroke:#111827,stroke-width:1px,color:#111827;

  class CLIENT client;
  class KCX kcx;
  class BE,S3,ING,RAW,API core;
```

## 4. Client-Side Components (AWS)

### 4.1 Billing Export

- Configured in AWS Billing & Cost Management.
- Export format: CSV or Parquet (e.g., Standard, CUR, FOCUS).
- Export frequency: hourly or daily.
- Files are immutable, time-partitioned, and append-only.

### 4.2 S3 Bucket (Client-Owned)

- Stores billing export files.
- Data ownership remains with the client.
- KCX never modifies or deletes files.

## 5. Trust & Access Model

### 5.1 IAM Role (Client → KCX)

- Client creates an IAM Role dedicated to KCX.
- Role permissions are limited to:
  - `s3:ListBucket`
  - `s3:GetObject`
- Permissions are scoped to the billing export bucket and prefix.

### 5.2 Role Assumption

- Trust policy allows the KCX AWS account to assume the role.
- Access is read-only, auditable, and revocable.
- STS is used for short-lived credentials (no long-lived secrets).

## 6. KCX Ingestion Layer

### 6.1 Ingestion Service

- A KCX-owned backend service or scheduled job.
- Uses AWS SDK.
- Assumes the client IAM role using STS.

### 6.2 Responsibilities

The ingestion service performs the following steps:

1. Assume client IAM role.
2. List billing files in the client S3 bucket (metadata only).
3. Identify files not yet ingested.
4. Read new files directly from S3 (in-memory streaming).
5. Parse billing rows.
6. Insert rows into the KCX raw database.
7. Update ingestion metadata.

Key constraints:

- No local disk storage.
- No copying files into KCX S3.
- No direct UI access to AWS.

## 7. Ingestion Metadata (Control Plane)

KCX maintains a file ingestion registry to track progress.

Example metadata fields:

- S3 object key.
- Billing period (start/end).
- Ingestion status (`NEW`, `INGESTED`, `FAILED`).
- Timestamps (first seen, ingested).

Purpose:

- Prevent duplicate ingestion.
- Enable retries.
- Support audits and reprocessing.
- Ensure deterministic behavior.

## 8. KCX Raw Billing Database

Characteristics:

- Stores billing data as received.
- No transformations.
- No aggregations.
- Includes source file reference per row.

Role:

- Acts as KCX’s system of record.
- Foundation for all downstream use cases.

## 9. Security & Compliance Principles

- Least-privilege IAM access.
- No long-lived credentials.
- No local or shadow copies of client data.
- Clear data ownership boundaries.
- Full auditability.

## 10. Key Clarifications

- AWS billing data is file-based, not streaming.
- KCX reads files; AWS does not push data.
- AWS SDK is a client library, not a console service.
- Full AWS account activation is required for billing access.

## 11. Scope Boundaries

Included:

- AWS billing exports.
- S3 access.
- SDK-based ingestion.
- Raw DB storage.

Explicitly excluded:

- Streaming systems.
- Event processing.
- Aggregations.
- Cost analytics logic.

---

**Final Note**

This ingestion architecture represents the industry-standard starting point for FinOps platforms. It is intentionally simple, controlled, and auditable, forming a stable base for future evolution.


**UI Work Started**