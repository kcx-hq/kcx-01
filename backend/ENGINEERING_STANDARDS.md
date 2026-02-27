# Backend Standards & Release Hardening Guide

## 1. Purpose & Scope

### What problems this standard solves
- Prevents response-shape drift across modules.
- Enforces default-deny auth and consistent authorization checks.
- Standardizes error handling and prevents sensitive data leakage.
- Keeps API versioning behavior stable while `/api` and `/api/v1` coexist.
- Ensures production-safe startup, readiness, observability, and graceful shutdown.
- Keeps DB/bootstrap/model loading deterministic for server and worker.

### What files/policies this covers
- App bootstrap/routing/readiness: `backend/src/app.js`
- Runtime startup/shutdown: `backend/src/server.js`
- Worker lifecycle: `backend/src/worker.js`
- DB config/instance: `backend/src/db/config.cjs`, `backend/src/db/index.cjs`
- Model loading/exports: `backend/src/models/index.cjs`, `backend/src/models/index.js`
- Response contract: `backend/src/middlewares/responseContract.js`
- Security middleware: `backend/src/middlewares/security/defaultDenyAuth.js`, `verifyS3IngestHmac.js`, `requestId.js`, `requestLogging.js`, `errorHandlers.js`, `requestValidation.js`
- Error type: `backend/src/errors/AppError.js`
- Logging/identity: `backend/src/lib/logger.cjs`, `backend/src/lib/logger.js`, `backend/src/lib/identityContext.js`
- Sequelize CLI wiring: `backend/.sequelizerc`
- Release scanning: `.pre-commit-config.yaml`, `.github/workflows/secret-scan.yml`, `.gitleaks.toml`

---

## 2. Repository Architecture Overview

- `src/app.js`: Express app composition, middleware order, health/readiness endpoints, route mounting.
- `src/server.js`: production runtime bootstrap (`db.init`, DB auth, listen), readiness cache, graceful shutdown.
- `src/worker.js`: ETL polling loop runtime, DB bootstrap, worker shutdown.
- `src/db/*`: Sequelize config from `DATABASE_URL` and singleton instance.
- `src/models/index.js`: ESM model exports and associations.
- `src/models/index.cjs`: CJS loader + `db.init()` bridge for runtime.
- `src/middlewares/*`: response, auth, request ID/logging, validation, error normalization.
- `src/modules/*`: domain routers/controllers/services (`shared`, `core-dashboard`, `clients`, `internal`).

### Runtime middleware order (`app.js`)
1. `compression`
2. `cors`
3. `express.json` (captures `req.rawBody`)
4. `express.urlencoded`
5. `cookieParser`
6. `attachRequestId`
7. `createInFlightTracker`
8. `requestLogging`
9. `successResponseContract`
10. `standardizeErrorResponses`
11. `defaultDenyAuth`
12. `requireInternalRole`
13. `validateRequest`
14. `/healthz`, `/readyz`
15. API routers (`/api` and `/api/v1`)
16. `/internal/cloud-account-credentials`
17. `notFoundHandler`
18. `errorHandler`

---

## 3. Response Contracts (Mandatory)

### Success format
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```
- `meta` is optional.
- `204` must return no body.

### Success examples
```js
return res.ok({ id: user.id, email: user.email });
return res.created({ uploadId });
return res.accepted({ status: "accepted" });
return res.noContent();
```

```json
{
  "success": true,
  "data": { "status": "ready" }
}
```

### Error format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required"
  },
  "requestId": "4ce8f1b3-..."
}
```

### Error example
```js
return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
```

### Allowed / forbidden patterns

#### Do
- Use `res.ok`, `res.created`, `res.accepted`, `res.noContent` for success.
- Use `next(new AppError(...))` for handled errors.
- Return immediately after response or `next(...)`.

#### Don’t
- Don’t send error payloads via `res.status(...).json(...)` in controllers.
- Don’t leak stack traces/cause details in response bodies.
- Don’t bypass helpers for new success paths.

---

## 4. Security & Access Control (Mandatory)

### Default deny rule
- All routes require auth by default via `defaultDenyAuth`.
- Public allowlist is explicit and regex-based:
  - `GET /healthz`, `GET /readyz`
  - `POST /api(/v1)/auth/login|signin|signup|verify|verify-email|reset|forgot-password|reset/:token|reset-password/:token`
- `OPTIONS` bypasses auth.

### `/internal/*` role rules
- Any path matching `^/internal(?:/|$)` requires role `admin` or `system`.
- Role check is case-insensitive (`requireInternalRole`).

### Tenant/client identity sourcing rule
- For non-internal API operations, derive identity from verified token (`req.user`, `req.client_id`), not request body.
- Use `getIdentityContext(req)` when logging.
- Keep tenant/client checks at service boundaries (ownership and scope checks).

### S3 ingest security rules
- Route: `POST /api(/v1)/etl/s3-ingest`.
- Required headers: `X-Signature`, `X-Timestamp`, `X-Nonce`.
- Signature: HMAC-SHA256 over `timestamp + "." + nonce + "." + rawBody`.
- `rawBody` is captured in `express.json(...verify...)`.
- Timestamp must be integer and within replay window (default `300s`, env `S3_INGEST_HMAC_WINDOW_SECONDS`).
- Nonce replay is blocked via in-memory nonce cache.
- Signature comparison uses `crypto.timingSafeEqual`.
- Client/tenant context must still come from auth identity; never trust body for tenant selection.

### Secure endpoint checklist
- Add route under `/api` mount (which auto-exposes `/api` and `/api/v1`).
- Add validation regex/schema in `requestValidation.js`.
- If endpoint must be public, add allowlist rule in `defaultDenyAuth.js`.
- Enforce authz policy (role/scope/ownership) in middleware or service.
- Use `AppError` for rejections.
- Log with `requestId` and identity fields.
- Return contract-compliant success/error envelopes.

---

## 5. Error Handling Standard (Mandatory)

### AppError usage pattern
```js
import AppError from "../../errors/AppError.js";

if (!req.user?.id) {
  return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
}
```

### Status/code mapping
| Status | Error Code | Message |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `Invalid request` |
| 401 | `UNAUTHENTICATED` | `Authentication required` |
| 403 | `UNAUTHORIZED` | `You do not have permission to perform this action` |
| 404 | `NOT_FOUND` | `Not found` |
| 409 | `CONFLICT` | `Conflict` |
| 429 | `RATE_LIMITED` | `Too many requests` |
| 503 | `NOT_READY` | `Service not ready` |
| 500 | `INTERNAL` | `Internal server error` |

Notes:
- Validation-like parser errors normalize to `400`.
- `422` is normalized to `400`.
- Unknown `5xx` normalizes to `500`.

### Production leak prevention policy
- Error responses are safe, status-based, and always include `requestId`.
- `errorHandler` logs internals server-side with redaction; response never returns stack/cause/body internals.
- Use generic safe messages in `AppError`.

### Adding new error codes safely
- Current response `error.code` is status-mapped in `errorHandlers.js` (`ERROR_META`), not directly from `AppError.code`.
- To introduce a new response code, update `ERROR_META` and normalization logic.
- Add/adjust tests that assert the error envelope contract.

---

## 6. API Versioning

### `/api` and `/api/v1` behavior
- `app.js` mounts the same routers under both base paths:
  - `const API_BASE_PATHS = ["/api", "/api/v1"]`
- Both prefixes must behave identically for same route/controller.

### Backward compatibility rules
- Do not ship behavior differences between `/api/...` and `/api/v1/...`.
- Keep validation/public-route regex patterns version-tolerant: `^/api(?:/v1)?/...`.
- `/internal/*` is intentionally not versioned.

### Add a new versioned route
1. Mount route in `mountApiRouters(app)` once using `${basePath}/...`.
2. Add request-validation rule using `/api(?:/v1)?/` pattern.
3. If public, add allowlist rule also using `/api(?:/v1)?/`.
4. Add API tests for both prefixes when compatibility risk is high.

---

## 7. Observability

### Logger usage (`pino`)
- Canonical logger: `backend/src/lib/logger.cjs` (`backend/src/lib/logger.js` wrapper).
- Replace `console.*` with structured logs.

```js
import logger from "../../lib/logger.js";

logger.info({ requestId: req.requestId, clientId: req.client_id }, "upload accepted");
logger.error({ err, requestId: req.requestId }, "upload failed");
```

### Request ID behavior
- Header: `x-request-id`.
- Accepts client-provided ID if it matches `[a-zA-Z0-9._-]{1,128}`.
- Otherwise generates UUID.
- Added to:
  - `req.requestId`
  - `res.locals.requestId`
  - response header
  - error envelope `requestId`

### Request logging fields
- `requestId`, `method`, `route`, `status`, `latencyMs`, `userId`, `clientId`, `tenantId`.

### Error logging standard
- Log with structured object and `err`.
- Include request + identity context.
- Never log decrypted credentials or secret raw values.

### Redaction rules
- Logger redacts auth/cookie/password/token/secret/api key fields and `DATABASE_URL`.
- Error handler also redacts sensitive keys in headers/body with pattern-based masking.

---

## 8. Health Checks & Readiness

### Endpoints
- `GET /healthz`: liveness only, returns `200` with `{ success: true, data: { status: "ok" } }`.
- `GET /readyz`: readiness check, returns:
  - `200` with `{ status: "ready" }` when dependencies are healthy.
  - `503` with standard error envelope when not ready.

### Readiness cache TTL
- `server.js` caches readiness result for `3000ms` (`READY_CACHE_TTL_MS`).

### Critical dependencies
- Current critical dependency: PostgreSQL (`db.sequelize.authenticate()`).
- During shutdown, readiness must fail (`NOT_READY`).

### Example curl commands
```bash
curl -i http://localhost:5000/healthz
curl -i http://localhost:5000/readyz
curl -i -H "x-request-id: local-smoke-001" http://localhost:5000/readyz
```

---

## 9. Graceful Shutdown

### Signal handling and sequence (`server.js`)
1. Handle `SIGINT`/`SIGTERM`.
2. Mark `shuttingDown = true`.
3. Start force-exit timer (`SHUTDOWN_TIMEOUT_MS`, default `20000`).
4. Close HTTP server (stop accepting new requests).
5. End/destroy open sockets.
6. Wait for in-flight requests to drain (bounded by timeout).
7. Close Sequelize pool (`db.sequelize.close()`).
8. Exit `0` on clean shutdown, `1` on timeout/failure.

### In-flight request tracking
- `createInFlightTracker` increments on request start.
- Decrements on `finish` or `close`.
- Count is used during shutdown drain phase.

### Worker stop guidance (`worker.js`)
- On signal: set shutdown flag, break sleep immediately, finish loop, close DB, exit.
- Worker also uses `SHUTDOWN_TIMEOUT_MS` force timer.

### Timeout/env vars
- `SHUTDOWN_TIMEOUT_MS` controls both server and worker shutdown deadlines.
- Keep it long enough for ETL/DB drains but finite for orchestrator health.

---

## 10. Database & Sequelize (Neon)

### Required env vars
- Required: `DATABASE_URL` (must be `postgres://` or `postgresql://`).
- Optional DB toggles:
  - `DB_SSL=false` to disable SSL
  - `DB_SSL_REJECT_UNAUTHORIZED=false` to relax SSL cert validation
  - `DB_LOGGING=true` to emit SQL via pino debug logs

### Sequelize CLI commands
```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:rollback
npm --prefix backend run db:seed
```
- `.sequelizerc` points to:
  - config: `src/db/config.cjs`
  - migrations: `src/db/migrations`
  - seeders: `src/db/seeders`
  - models: `src/models`

### Runtime init order
- Server path:
  1. `await db.init()`
  2. `await db.sequelize.authenticate()`
  3. `app.listen(...)`
- Worker path:
  1. `await db.init()`
  2. `await db.sequelize.authenticate()`
  3. start poll loop

### Model export rules
- Define models against singleton sequelize from `src/db/index.cjs`.
- Export models as named ESM exports in `src/models/index.js`.
- Keep `src/models/index.cjs` as the runtime loader and `db.init()` owner.

### Troubleshooting checklist
- `DATABASE_URL is required`: set env in `backend/.env.<NODE_ENV>`.
- TLS/SSL connection errors: verify `DB_SSL` and `DB_SSL_REJECT_UNAUTHORIZED`.
- `Sequelize` model undefined at runtime: ensure `await db.init()` ran before usage.
- Contract mismatch in errors: verify `errorHandlers.js` mapping and controller `next(AppError)` usage.
- Duplicate migration/table errors: verify migration history and avoid duplicate migration files.

---

## 11. Local Development Workflow

### Exact commands
```bash
npm --prefix backend install
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
npm --prefix backend run dev
```

Run worker in a second terminal:
```bash
npm --prefix backend run worker
```

### Required env setup
- Create/update `backend/.env.development`.
- `src/config/env.js` validates many required vars at startup.
- At minimum for DB/auth/readiness flows, ensure valid `DATABASE_URL`, `JWT_SECRET`, and related required envs are populated.

### Verify everything works
```bash
curl -i http://localhost:5000/healthz
curl -i http://localhost:5000/readyz
```
- Confirm `readyz` returns `200` only when DB is reachable.
- Confirm protected routes reject unauthenticated requests with standardized error envelope.
- Run tests as needed:
```bash
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix backend run test:api
npm --prefix backend run test:component
```

---

## 12. CI / Pre-commit Security Scanning (If present)

### Enforced scanners
- Pre-commit: `gitleaks` via `.pre-commit-config.yaml`.
- CI: GitHub Actions workflow `.github/workflows/secret-scan.yml` runs `gitleaks git`.

### Run locally
```bash
pre-commit run --all-files
gitleaks git --no-banner --redact --verbose --config .gitleaks.toml
```

### Failure behavior
- Pre-commit scan failure blocks commit.
- GitHub Action failure blocks PR/branch checks until secrets are removed or false positives are handled per policy.

---

## 13. Add a New Module / Endpoint Template

### Router skeleton (`backend/src/modules/shared/widgets/widget.route.js`)
```js
import express from "express";
import { createWidget, getWidget } from "./widget.controller.js";
import AppError from "../../../errors/AppError.js";

const router = express.Router();

function requireRole(allowed = []) {
  return (req, _res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!allowed.map((r) => r.toLowerCase()).includes(role)) {
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
    }
    return next();
  };
}

router.post("/", requireRole(["admin", "system"]), createWidget);
router.get("/:widgetId", getWidget);

export default router;
```

### Controller skeleton (`backend/src/modules/shared/widgets/widget.controller.js`)
```js
import crypto from "crypto";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export async function createWidget(req, res, next) {
  try {
    if (!req.user?.id || !req.client_id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const { name } = req.body;
    if (!name) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const widget = { id: crypto.randomUUID(), name, clientId: req.client_id };

    logger.info(
      { requestId: req.requestId, userId: req.user.id, clientId: req.client_id, widgetId: widget.id },
      "widget created"
    );

    return res.created(widget);
  } catch (err) {
    logger.error({ err, requestId: req.requestId, clientId: req.client_id }, "create widget failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
}

export async function getWidget(req, res, next) {
  try {
    const { widgetId } = req.params;
    if (!widgetId) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    return res.ok({ id: widgetId, clientId: req.client_id });
  } catch (err) {
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
}
```

### Validation hook usage (`backend/src/middlewares/security/requestValidation.js`)
```js
{
  method: "POST",
  pattern: /^\/api(?:\/v1)?\/widgets\/?$/i,
  body: z.object({
    name: z.string().trim().min(1).max(200),
  }).strict(),
},
{
  method: "GET",
  pattern: /^\/api(?:\/v1)?\/widgets\/(?<widgetId>[^/]+)\/?$/i,
  params: z.object({
    widgetId: z.string().uuid(),
  }).strict(),
},
```

### Authorization hook usage
- Protected by default through global `defaultDenyAuth`.
- Add explicit role/scope middleware for sensitive actions (as shown above).
- For public endpoints only, add allowlist entry in `defaultDenyAuth.js`.

### Mount routes under `/api/v1` (and `/api`)
Add in `mountApiRouters(app)` inside `backend/src/app.js`:
```js
import widgetRoutes from "./modules/shared/widgets/widget.route.js";

function mountApiRouters(app) {
  for (const basePath of ["/api", "/api/v1"]) {
    app.use(`${basePath}/widgets`, widgetRoutes);
  }
}
```

### Endpoint hardening quick Do/Don’t
#### Do
- Use `res.ok`/`res.created` and `next(AppError)`.
- Use token-derived identity (`req.user`, `req.client_id`) for tenant scoping.
- Add validation regex/schema with `/api(?:/v1)?/`.
- Emit structured logs with `requestId`.

#### Don’t
- Don’t trust `clientId`/tenant identifiers from request body on external routes.
- Don’t return raw thrown errors to clients.
- Don’t add new routes without validation and authz checks.
