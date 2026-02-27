import { createRequire } from "module";
import env from "./config/env.js";
import AppError from "./errors/AppError.js";
import logger from "./lib/logger.js";
import { createApp } from "./app.js";

const require = createRequire(import.meta.url);
const db = require("./models/index.cjs");

const READY_CACHE_TTL_MS = 3000;

let serverRef = null;
let shuttingDown = false;
let shutdownPromise = null;
let signalHandlersRegistered = false;
const openConnections = new Set();
const inFlightCounterRef = { count: 0 };
const readinessState = {
  checkedAt: 0,
  isReady: false,
  error: null,
};

async function checkReadiness() {
  if (shuttingDown) {
    return {
      ready: false,
      error: new AppError(503, "NOT_READY", "Service not ready"),
    };
  }

  const now = Date.now();
  if (now - readinessState.checkedAt < READY_CACHE_TTL_MS) {
    return {
      ready: readinessState.isReady,
      error: readinessState.error,
    };
  }

  try {
    await db.sequelize.authenticate();
    readinessState.checkedAt = now;
    readinessState.isReady = true;
    readinessState.error = null;
    return { ready: true, error: null };
  } catch (error) {
    readinessState.checkedAt = now;
    readinessState.isReady = false;
    readinessState.error = error;
    return { ready: false, error };
  }
}

const app = createApp({ readiness: checkReadiness, inFlightCounterRef });
const PORT = env.PORT;

async function gracefulShutdown(signal) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    shuttingDown = true;
    const timeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS || 20000);
    logger.warn(
      {
        signal,
        timeoutMs,
        inFlightRequests: inFlightCounterRef.count,
        openConnections: openConnections.size,
      },
      "graceful shutdown started"
    );

    const forceExitTimer = setTimeout(() => {
      logger.error(
        {
          signal,
          timeoutMs,
          inFlightRequests: inFlightCounterRef.count,
          openConnections: openConnections.size,
        },
        "graceful shutdown timeout reached; forcing exit"
      );
      process.exit(1);
    }, timeoutMs);
    forceExitTimer.unref();

    if (serverRef) {
      await new Promise((resolve) => serverRef.close(resolve));
      logger.info("http server closed for new connections");
    }

    for (const socket of openConnections) {
      socket.end();
      setTimeout(() => socket.destroy(), 1000).unref();
    }

    const waitStartedAt = Date.now();
    while (inFlightCounterRef.count > 0 && Date.now() - waitStartedAt < timeoutMs) {
      logger.info(
        { inFlightRequests: inFlightCounterRef.count },
        "waiting for in-flight requests to complete"
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      await db.sequelize.close();
      logger.info("database connections closed");
    } catch (error) {
      logger.error({ err: error }, "failed to close database connections");
    }

    clearTimeout(forceExitTimer);
    logger.info({ signal }, "graceful shutdown complete");
    process.exit(0);
  })();

  return shutdownPromise;
}

function registerSignalHandlers() {
  if (signalHandlersRegistered) {
    return;
  }
  signalHandlersRegistered = true;

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      void gracefulShutdown(signal);
    });
  }
}

export async function startServer() {
  try {
    await db.init();
    logger.info({ models: Object.keys(db.models) }, "loaded models");
    logger.info({ inquiryExists: Boolean(db.Inquiry) }, "model check");
    logger.info(
      {
        sameSequelizeInstance: db.Inquiry?.sequelize === db.sequelize,
      },
      "same sequelize instance check"
    );

    await db.sequelize.authenticate();
    await db.sequelize.sync({force : false , alter : false}) ;
    logger.info("db connected");
    await db.Inquiry.findOne();
    logger.info("db query OK");

    serverRef = app.listen(PORT, () => {
      logger.info({ port: PORT }, "server listening");
    });

    serverRef.on("connection", (socket) => {
      openConnections.add(socket);
      socket.on("close", () => {
        openConnections.delete(socket);
      });
      if (shuttingDown) {
        socket.destroy();
      }
    });

    registerSignalHandlers();
    return serverRef;
  } catch (err) {
    logger.error({ err }, "database startup failure");
    process.exit(1);
  }
}

if (env.NODE_ENV !== "test") {
  startServer();
}

export default app;
