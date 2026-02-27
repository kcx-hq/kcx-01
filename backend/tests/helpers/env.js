import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const REQUIRED_FALLBACK_DB_VARS = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const UNSAFE_DB_PATTERN = /(prod|production|live|primary|master)/i;

const TEST_DEFAULTS = Object.freeze({
  NODE_ENV: "test",
  PORT: "5001",
  SHUTDOWN_TIMEOUT_MS: "20000",
  TEST_DB_AUTO_MANAGE: "true",
  TEST_DB_SERVICE_NAME: "postgres_test",
  TEST_DOCKER_COMPOSE_FILE: "docker-compose.test.yml",
  DB_SSL: "false",
  DB_HOST: "localhost",
  DB_PORT: "54329",
  DB_USER: "test",
  DB_PASSWORD: "test",
  DB_NAME: "app_test",
  DATABASE_URL: "postgres://test:test@localhost:54329/app_test",
  JWT_SECRET: "test-jwt-secret-12345",
  JWT_EXPIRES_IN: "1h",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_USER: "test-user",
  SMTP_PASS: "test-pass",
  COMPANY_EMAIL: "qa@example.com",
  MAILGUN_API_KEY: "test-mailgun-key",
  MAILGUN_DOMAIN: "sandbox.example.com",
  MAILGUN_FROM: "noreply@example.com",
  FRONTEND_URL: "http://localhost:5173",
  BACKEND_URL: "http://localhost:5001",
  GOOGLE_CALENDAR_ID: "test-calendar-id",
  ZOOM_ACCOUNT_ID: "test-zoom-account",
  ZOOM_CLIENT_ID: "test-zoom-client",
  ZOOM_CLIENT_SECRET: "test-zoom-secret",
  ZOOM_SECRET_TOKEN: "test-zoom-token",
  GROQ_API_KEY: "test-groq-key",
  AWS_REGION: "us-east-1",
  AWS_BILLING_REGION: "us-east-1",
  AWS_ASSUME_ROLE_ARN: "arn:aws:iam::123456789012:role/test-role",
  AWS_ASSUME_ROLE_SESSION_NAME: "test-session",
  AWS_ACCESS_KEY_ID: "AKIATESTKEY123456",
  AWS_SECRET_ACCESS_KEY: "test-secret-access-key",
  CRED_ENC_KEY: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  S3_INGEST_HMAC_SECRET: "test-hmac-secret-12345",
  S3_INGEST_HMAC_WINDOW_SECONDS: "300",
});

let cachedEnv = null;

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const backendRoot = path.resolve(currentDir, "..", "..");

function loadEnvFiles() {
  const candidates = [
    { path: path.resolve(backendRoot, ".env.test"), override: false },
    { path: path.resolve(backendRoot, ".env.test.local"), override: true },
  ];

  for (const { path: envPath, override } of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override, quiet: true });
    }
  }
}

function applyDefaultValues() {
  for (const [name, value] of Object.entries(TEST_DEFAULTS)) {
    if (typeof process.env[name] === "undefined") {
      process.env[name] = value;
    }
  }
} // apply default values for undefined name

function ensureNodeEnvIsTest() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "test";
  }

  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `Invalid NODE_ENV "${process.env.NODE_ENV}" for tests. NODE_ENV must be "test".`
    );
  }
}

function validateRequiredVars() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const missing = REQUIRED_FALLBACK_DB_VARS.filter(
    (name) => !process.env[name] || String(process.env[name]).trim() === ""
  );

  if (missing.length > 0) {
    throw new Error(`Missing required test environment variables: ${missing.join(", ")}`);
  }
}

function buildDatabaseUrlFromParts() {
  const host = String(process.env.DB_HOST || "").trim();
  const port = String(process.env.DB_PORT || "").trim();
  const user = String(process.env.DB_USER || "").trim();
  const password = String(process.env.DB_PASSWORD || "").trim();
  const dbName = String(process.env.DB_NAME || "").trim();

  if (!host || !port || !user || !password || !dbName) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDbName = encodeURIComponent(dbName);

  return `postgres://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDbName}`;
}

function getExpectedDockerDbTarget() {
  const host = String(process.env.DB_HOST || "").trim();
  const port = String(process.env.DB_PORT || "").trim();

  return {
    host,
    port,
  };
}

export function assertSafeDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for test execution.");
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch (error) {
    throw new Error(`DATABASE_URL is not a valid URL: ${databaseUrl}`);
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use postgres:// or postgresql:// for tests.");
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  const inspectionTarget = `${parsed.hostname} ${parsed.username} ${databaseName}`;
  const expectedTarget = getExpectedDockerDbTarget();

  if (
    UNSAFE_DB_PATTERN.test(inspectionTarget) &&
    process.env.ALLOW_UNSAFE_TEST_DATABASE !== "true"
  ) {
    throw new Error(
      `Refusing to run tests against potentially unsafe DATABASE_URL: ${databaseUrl}`
    );
  }

  if (!databaseName.toLowerCase().includes("test")) {
    throw new Error(
      `Refusing to run tests against DATABASE_URL without "test" in database name: ${databaseUrl}`
    );
  }

  if (
    expectedTarget.host &&
    parsed.hostname !== expectedTarget.host &&
    process.env.ALLOW_NON_DOCKER_TEST_DATABASE !== "true"
  ) {
    throw new Error("Test suite is not connected to Docker database");
  }

  if (
    expectedTarget.port &&
    parsed.port !== expectedTarget.port &&
    process.env.ALLOW_NON_DOCKER_TEST_DATABASE !== "true"
  ) {
    throw new Error("Test suite is not connected to Docker database");
  }

  return parsed;
}

export function loadTestEnv(options = {}) {
  const { forceReload = false } = options;

  if (!forceReload && cachedEnv) {
    return cachedEnv;
  }

  ensureNodeEnvIsTest();
  loadEnvFiles();
  applyDefaultValues();
  if (!process.env.DATABASE_URL) {
    const fromParts = buildDatabaseUrlFromParts();
    if (fromParts) {
      process.env.DATABASE_URL = fromParts;
    }
  }
  validateRequiredVars();
  assertSafeDatabaseUrl();

  cachedEnv = Object.freeze({ ...process.env });
  return cachedEnv;
}

export function getTestEnv() {
  if (!cachedEnv) {
    return loadTestEnv();
  }
  return cachedEnv;
}
