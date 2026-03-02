import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const nodeEnv = process.env.NODE_ENV || "development";
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, `../../.env.${nodeEnv}`);

dotenv.config({
  path: envPath,
  quiet: true,
});

const requiredString = (name) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a string`,
    })
    .trim()
    .min(1, `${name} is required`);

const requiredPort = (name) =>
  requiredString(name)
    .regex(/^\d+$/, `${name} must be a valid integer`)
    .transform(Number)
    .pipe(z.number().int().min(1, `${name} must be >= 1`).max(65535, `${name} must be <= 65535`));

const requiredPositiveInt = (name) =>
  requiredString(name)
    .regex(/^\d+$/, `${name} must be a valid integer`)
    .transform(Number)
    .pipe(z.number().int().min(1, `${name} must be >= 1`));

const awsRegionPattern = /^[a-z]{2}-[a-z-]+-\d$/;
const awsRoleArnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: requiredPort("PORT").default(5000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  SHUTDOWN_TIMEOUT_MS: requiredPositiveInt("SHUTDOWN_TIMEOUT_MS").default(20000),
  DB_SSL: z.enum(["true", "false"]).optional(),

  DATABASE_URL: requiredString("DATABASE_URL").refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "DATABASE_URL must start with postgres:// or postgresql://"
  ),

  JWT_SECRET: requiredString("JWT_SECRET").min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: requiredString("JWT_EXPIRES_IN"),

  SMTP_HOST: requiredString("SMTP_HOST"),
  SMTP_PORT: requiredPort("SMTP_PORT"),
  SMTP_USER: requiredString("SMTP_USER"),
  SMTP_PASS: requiredString("SMTP_PASS"),

  COMPANY_EMAIL: requiredString("COMPANY_EMAIL").email("COMPANY_EMAIL must be a valid email"),
  MAILGUN_API_KEY: requiredString("MAILGUN_API_KEY"),
  MAILGUN_DOMAIN: requiredString("MAILGUN_DOMAIN"),
  MAILGUN_FROM: requiredString("MAILGUN_FROM").email("MAILGUN_FROM must be a valid email"),

  FRONTEND_URL: requiredString("FRONTEND_URL").url("FRONTEND_URL must be a valid URL"),
  BACKEND_URL: requiredString("BACKEND_URL").url("BACKEND_URL must be a valid URL"),

  GOOGLE_CALENDAR_ID: requiredString("GOOGLE_CALENDAR_ID"),

  ZOOM_ACCOUNT_ID: requiredString("ZOOM_ACCOUNT_ID"),
  ZOOM_CLIENT_ID: requiredString("ZOOM_CLIENT_ID"),
  ZOOM_CLIENT_SECRET: requiredString("ZOOM_CLIENT_SECRET"),
  ZOOM_SECRET_TOKEN: requiredString("ZOOM_SECRET_TOKEN"),

  GROQ_API_KEY: requiredString("GROQ_API_KEY"),

  AWS_REGION: z
    .string()
    .trim()
    .min(1, "AWS_REGION is required")
    .regex(awsRegionPattern, "AWS_REGION must be a valid AWS region")
    .optional(),
  AWS_BILLING_REGION: z
    .string()
    .trim()
    .min(1, "AWS_BILLING_REGION is required")
    .regex(awsRegionPattern, "AWS_BILLING_REGION must be a valid AWS region")
    .optional(),
  AWS_ASSUME_ROLE_ARN: z
    .string()
    .trim()
    .min(1, "AWS_ASSUME_ROLE_ARN is required")
    .regex(awsRoleArnPattern, "AWS_ASSUME_ROLE_ARN must be a valid IAM role ARN")
    .optional(),
  AWS_ASSUME_ROLE_SESSION_NAME: z
    .string()
    .trim()
    .min(2, "AWS_ASSUME_ROLE_SESSION_NAME must be at least 2 characters")
    .max(64, "AWS_ASSUME_ROLE_SESSION_NAME must be at most 64 characters")
    .optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().min(1, "AWS_ACCESS_KEY_ID is required").optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().min(1, "AWS_SECRET_ACCESS_KEY is required").optional(),

  CRED_ENC_KEY: requiredString("CRED_ENC_KEY").regex(
    /^[a-f0-9]{64}$/i,
    "CRED_ENC_KEY must be a 64-character hex string"
  ),

  S3_INGEST_HMAC_SECRET: z
    .string()
    .trim()
    .min(16, "S3_INGEST_HMAC_SECRET must be at least 16 characters")
    .optional(),
  S3_INGEST_HMAC_WINDOW_SECONDS: requiredPort("S3_INGEST_HMAC_WINDOW_SECONDS").default(300),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = Object.freeze(parsed.data);
export default env;
