const pino = require("pino");

const nodeEnv = process.env.NODE_ENV || "development";
const isDevelopment = nodeEnv === "development";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['set-cookie']",
  "headers.authorization",
  "headers.cookie",
  "headers['set-cookie']",
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "*.password",
  "token",
  "*.token",
  "secret",
  "*.secret",
  "apiKey",
  "*.apiKey",
  "apikey",
  "*.apikey",
  "DATABASE_URL",
];

const transport =
  isDevelopment && process.env.PINO_PRETTY !== "false"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: true,
        },
      }
    : undefined;

const logger = pino({
  name: "backend",
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  ...(transport ? { transport } : {}),
});

module.exports = logger;
