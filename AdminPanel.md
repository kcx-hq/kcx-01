# KCX Admin Panel v1

## Goal
Build a separate-branch Admin Panel v1 for the KCX platform as a practical control room using only current, real platform signals and operations.

## 1) Overview
A single control-room page with real signals available today:

- Total clients/tenants (or orgs, if this concept exists)
- Total users
- Uploads today / this week
- Uploads failed
- AWS connections: valid / failed / never validated
- Recent activity feed:
  - signup
  - inquiry submitted
  - upload status changes
  - connection validated

## 2) Users & Access
Based on existing login/signup:

- Users list with filters:
  - email
  - date
  - status
- Status values:
  - active
  - disabled (can be placeholder behavior for now)
- User detail view:
  - created date
  - last login
  - tenant/client mapping
- Role visibility (show-only):
  - Admin
  - Client user

Scope note: no complex IAM in v1; only visibility plus basic control.

## 3) Inquiries (Lead Intake)
Based on existing Inquiry capability:

- Inquiry list showing:
  - name
  - company
  - email
  - message
  - timestamp
- Inquiry statuses:
  - new
  - contacted
  - closed
- Quick actions (simple UI/logic):
  - mark as contacted
  - add note

Purpose: serve as a mini internal CRM until a dedicated integration is added later.

## 4) Upload Operations (CSV + AWS-selected files)
Ingestion-focused admin module (highest value):

- Global uploads list across all users/clients
- Filters:
  - status: pending / processing / completed / failed
  - source type: CSV / AWS
- Upload detail panel:
  - lifecycle timeline
  - file metadata
  - failure message (if any)
  - retry button (placeholder or real only if safe)
  - who triggered + timestamp (audit-lite)

## 5) AWS Connections
For existing Connect AWS capability:

- Connections list fields:
  - client/user
  - role ARN
  - bucket/prefix
  - region
  - validation status
  - last validated
  - last access attempt
- Connection detail panel:
  - config snapshot
  - validation logs (minimal is acceptable)
  - force revalidate (placeholder allowed)

## 6) Dashboard Context / Data Health
Admin should provide diagnostics, not duplicate analytics dashboard:

- Which uploads are usable for dashboard?
- Any processed data missing?
- Last processed upload per tenant
- Basic data freshness indicator

Scope note: keep this minimal and operational.

## Explicitly Out of Scope in v1
Do **not** build these now:

- Capability engine UI (unless modules are already truly gated)
- Client-to-capability matrix
- Advanced governance scores and policy automation
- Incident management workflows

These belong to later versions, not Admin Panel v1.