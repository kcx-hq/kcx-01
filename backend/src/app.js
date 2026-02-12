import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";

import sequelize from "./config/db.config.js";

import authRoutes from "./modules/shared/auth/auth.route.js";
import inquiryRoutes from "./modules/shared/inquiry/inquiry.route.js";
import etlRoutes from "./modules/shared/ETL/etl.route.js";
import coreDashboardRoutes from "./modules/core-dashboard/core-dashboard.routes.js";
import capabililitesRoutes from "./modules/shared/capabilities/capabilities.routes.js";
import chatbotRoutes from "./modules/shared/chatbot/chat.routes.js";
import getClientDashboardRoutes from "./modules/clients/index.js";

import { requestTiming } from "./middlewares/requestTiming.js";
import { perfBucket } from "./utils/test/perfBucket.js";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const app = express();
app.use(express.json({ limit: "10mb" }));


// PERFORMANCE: compress > 1KB
app.use(compression({ level: 6, threshold: 1024 }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173", "https://kcx-01.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// // Timing middleware should be before routes
app.use(requestTiming);
app.use(perfBucket);

app.use((req, _res, next) => {
  if (req.originalUrl.includes("/api/auth/signup")) {
    console.log("CT:", req.headers["content-type"]);
    console.log("CL:", req.headers["content-length"]);
    console.log("body now:", req.body);
  }
  next();
});

// Routes
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/etl", etlRoutes);
app.use("/api/capabililites", capabililitesRoutes);
app.use("/api/dashboard", coreDashboardRoutes);
app.use("/api/chatbot", chatbotRoutes);

getClientDashboardRoutes(app);

const PORT = process.env.PORT || 5000;

// ---- DB warmup + keepalive helpers ----
async function warmupDb() {
  const run = async (label) => {
    const t0 = process.hrtime.bigint();
    await sequelize.query("SELECT 1");
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`${label} ${ms.toFixed(2)} ms`);
  };

  try {
    await run("warmup1_ms:");
    await run("warmup2_ms:");
  } catch (e) {
    console.error("DB warmup failed:", e.message);
  }
}

let keepAliveTimer = null;
function startDbKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(async () => {
    try {
      await sequelize.query("SELECT 1");
      console.log("db_keepalive_ok");
    } catch (e) {
      console.error("db_keepalive_failed", e.message);
    }
  }, 60_000);
  // Don’t keep the process alive just because of this timer
  keepAliveTimer.unref?.();
}

async function start() {
  try {
    // Connect DB
    await sequelize.authenticate();
    console.log("Database connected successfully");

    // Warmup (helps Neon/serverless DB)
    await warmupDb();

    // Start keepalive after successful connect
    startDbKeepAlive();

    // ⚠️ Avoid sync() in production; use migrations instead
    const shouldSync =
      (process.env.NODE_ENV || "development") !== "production" &&
      process.env.DB_SYNC !== "false";

    if (shouldSync) {
      await sequelize.sync({ force: false, alter: false });
      console.log("Sequelize sync completed (non-production)");
    } else {
      console.log("Skipping sequelize.sync (production / DB_SYNC=false)");
    }

    // Start server
    const server = app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down...`);
      try {
        server.close(() => console.log("HTTP server closed"));
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        await sequelize.close();
        console.log("DB connection closed");
        process.exit(0);
      } catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();
