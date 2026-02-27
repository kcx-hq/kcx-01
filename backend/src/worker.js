import { createRequire } from "module";
import { pollOnce } from "./modules/shared/ETL/pollOnce.js";
import { computeWorkerSleepMs } from "./modules/shared/ETL/lib/pollWorker.utils.js";
import logger from "./lib/logger.js";

const require = createRequire(import.meta.url);
const db = require("./models/index.cjs");

const INTERVAL_MS = 2 * 60 * 1000;
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 20000);

let shuttingDown = false;
let shutdownTimer = null;
let releaseSleep = null;

function sleep(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      releaseSleep = null;
      resolve();
    }, ms);

    releaseSleep = () => {
      clearTimeout(timer);
      releaseSleep = null;
      resolve();
    };
  });
}

function beginShutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.warn({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, "worker shutdown started");

  shutdownTimer = setTimeout(() => {
    logger.error({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, "worker shutdown timed out");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  shutdownTimer.unref();

  if (releaseSleep) {
    releaseSleep();
  }
}

async function shutdownCleanly(signal) {
  try {
    await db.sequelize.close();
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    logger.info({ signal }, "worker shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err, signal }, "worker shutdown failed");
    process.exit(1);
  }
}

function registerSignalHandlers() {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      beginShutdown(signal);
    });
  }
}

async function main() {
  registerSignalHandlers();
  await db.init();
  await db.sequelize.authenticate();
  logger.info("worker connected to DB");

  while (!shuttingDown) {
    const started = Date.now();

    try {
      logger.info("poll cycle started");
      await pollOnce();
      logger.info("poll cycle done");
    } catch (err) {
      logger.error({ err }, "poll cycle failed");
    }

    if (shuttingDown) {
      break;
    }

    const wait = computeWorkerSleepMs({
      intervalMs: INTERVAL_MS,
      startedAtMs: started,
      nowMs: Date.now(),
      minimumMs: 10_000,
    });
    logger.info({ sleepSeconds: Math.round(wait / 1000) }, "worker sleeping before next cycle");
    await sleep(wait);
  }

  await shutdownCleanly("loop-exit");
}

main().catch((err) => {
  logger.error({ err }, "worker crashed");
  process.exit(1);
});
