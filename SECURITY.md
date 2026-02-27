# Backend Security Controls

## Default-Deny Routing

All backend routes are authenticated by default.

Requests without valid auth are rejected with `401 Unauthorized`, except for the explicit public auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/signin` (legacy alias)
- `POST /api/auth/signup`
- `POST /api/auth/verify`
- `POST /api/auth/verify-email` (legacy alias)
- `POST /api/auth/reset`
- `POST /api/auth/forgot-password` (legacy alias)
- `POST /api/auth/reset/:token`
- `POST /api/auth/reset-password/:token` (legacy alias)

## Authorization Rules

- Any route under `/internal/*` requires role `admin` or `system`.
- Denials:
  - `401` when unauthenticated.
  - `403` when authenticated but role is insufficient.

Role is read from the verified JWT claim `role`.

## Tenant / Client Context Enforcement

Tenant/client context is bound to verified identity (`client_id` from JWT claims).

- Authorization and data access decisions do not trust caller-provided `tenantId`/`clientId` from body/query/headers.
- `/internal/cloud-account-credentials`requires `clientId` from request.body (admin add credentials for clients).
- `/api/etl/s3-ingest` hits by system (automated), so clientId doesn't matter.

## S3 Ingest Signature Verification (HMAC)

Endpoint: `POST /api/etl/s3-ingest`

Required headers:

- `X-Signature`: HMAC-SHA256 signature (hex or base64)
- `X-Timestamp`: Unix timestamp (seconds)
- `X-Nonce`: Unique nonce per request

Signing input:

- `X-Timestamp + "." + X-Nonce + "." + raw_request_body_bytes`

Verification behavior:

- Constant-time signature comparison.
- Replay protection:
  - timestamp window check (default `300` seconds).
  - nonce cache rejection for re-used nonces inside the replay window.
- Invalid/missing signature headers are rejected with `401`.

## Required Environment Variables

- `JWT_SECRET`: JWT verification secret for auth.
- `S3_INGEST_HMAC_SECRET`: secret key used to verify ingest request signatures.
- `S3_INGEST_HMAC_WINDOW_SECONDS` (optional): replay window in seconds (defaults to `300`).
- `CRED_ENC_KEY`: 64-character hex key for credential encryption/decryption.

## Auth Usage in Development

Use either:

- `Authorization: Bearer <jwt>`
- or authenticated cookie (`kandco_token`)

JWT must include:

- `id` (user id)
- `role` (for RBAC checks)
- `client_id` (tenant/client binding)
