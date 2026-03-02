import express from "express";
import compression from "compression";
import AppError from "./errors/AppError.js";
import authRoutes from "./modules/shared/auth/auth.route.js";
import inquiryRoutes from "./modules/shared/inquiry/inquiry.route.js";
import etlRoutes from "./modules/shared/ETL/etl.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import coreDashboardRoutes from "./modules/core-dashboard/core-dashboard.routes.js";
import capabililitesRoutes from "./modules/shared/capabilities/capabilities.routes.js";
import chatbotRoutes from "./modules/shared/chatbot/chat.routes.js";
import cloudRoutes from "./modules/shared/cloud/cloud.route.js";
import cloudAccountCredentialsRoutes from "./modules/internal/cloud-account-credentials/cloudAccountCredential.route.js";
import clientRoutes from "./modules/clients/index.js";
import { attachRequestId } from "./middlewares/security/requestId.js";
import { validateRequest } from "./middlewares/security/requestValidation.js";
import {
  createInFlightTracker,
  requestLogging,

} from "./middlewares/security/requestLogging.js";
import adminRoutes from "./modules/admin/admin.route.js";
import adminAuthRoutes from "./modules/admin/auth/admin-auth.route.js";
import {
  defaultDenyAuth,
  requireInternalRole,
} from "./middlewares/security/defaultDenyAuth.js";
import { successResponseContract } from "./middlewares/responseContract.js";
import {
  errorHandler,
  notFoundHandler,
  standardizeErrorResponses,
} from "./middlewares/security/errorHandlers.js";

const API_BASE_PATHS = ["/api", "/api/v1"];
const INTERNAL_BASE_PATHS = ["/internal", "/api/internal", "/api/v1/internal"];
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "https://www.kcxhq.com",
];

const getAllowedOrigins = () => {
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.ADMIN_URL]
    .filter((origin) => typeof origin === "string" && origin.trim() !== "")
    .map((origin) => origin.trim());

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]));
};

function mountApiRouters(app) {
  for (const basePath of API_BASE_PATHS) {
    app.use(`${basePath}/auth`, authRoutes);
    app.use(`${basePath}/inquiry`, inquiryRoutes);
    app.use(`${basePath}/etl`, etlRoutes);
    app.use(`${basePath}/capabililites`, capabililitesRoutes);
    app.use(`${basePath}/dashboard`, coreDashboardRoutes);
    app.use(`${basePath}/chatbot`, chatbotRoutes);
    app.use(`${basePath}/cloud`, cloudRoutes);
    // app.use(basePath, clientRoutes);
    app.use(`${basePath}/admin/auth` , adminAuthRoutes)
    app.use(`${basePath}/admin` , adminRoutes)
  }
}

async function defaultReadiness() {
  return {
    ready: false,
    error: new AppError(503, "NOT_READY", "Service not ready"),
  };
}

export function createApp(deps = {}) {
  const {
    readiness = defaultReadiness,
    inFlightCounterRef = { count: 0 },
  } = deps;
  const app = express();

  app.disable("x-powered-by");

  app.disable('etag'); // Before compression middleware

  // PERFORMANCE: Add compression middleware to reduce response sizes
  // app.use(compression({ level: 6, threshold: 1024 })); // Compress responses > 1KB

  app.use(
    cors({
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-Signature",
        "X-Timestamp",
        "X-Nonce",
      ],
    })
  );
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    })
  ); // Limit JSON payload size
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(attachRequestId);
  app.use(createInFlightTracker(inFlightCounterRef));
  app.use(requestLogging);
  app.use(successResponseContract);
  app.use(standardizeErrorResponses);
  
// // PERFORMANCE: Add HTTP caching headers for static-like API responses
// app.use((req, res, next) => {
//   // Cache filter options and static data for 5 minutes
//   if (req.path.includes('/filters') || req.path.includes('/options')) {
//     res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
//   }
//   // Cache overview data for 1 minute (can be stale)
//   else if (req.path.includes('/overview') || req.path.includes('/dashboard')) {
//     res.set('Cache-Control', 'public, max-age=60'); // 1 minute
//   }
//   next();
// });

  // Global default deny: every route is authenticated unless explicitly public.
  app.use(defaultDenyAuth);
  app.use(requireInternalRole);
  app.use(validateRequest);

  app.get("/healthz", (_req, res) => {
    return res.ok({ status: "ok" });
  });

  app.get("/readyz", async (_req, res, next) => {
    const readinessResult = await readiness();
    if (!readinessResult.ready) {
      return next(
        new AppError(503, "NOT_READY", "Service not ready", {
          cause:
            readinessResult.error instanceof Error
              ? readinessResult.error
              : undefined,
        })
      );
    }
    return res.ok({ status: "ready" });
  });

  // Routes
  mountApiRouters(app);
  for (const basePath of INTERNAL_BASE_PATHS) {
    app.use(`${basePath}/cloud-account-credentials`, cloudAccountCredentialsRoutes);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
