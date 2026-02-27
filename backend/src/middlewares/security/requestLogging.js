import logger from "../../lib/logger.js";
import { getIdentityContext } from "../../lib/identityContext.js";

function resolveRoute(req) {
  if (req.route?.path) {
    const baseUrl = req.baseUrl || "";
    const routePath = String(req.route.path);
    return `${baseUrl}${routePath}`;
  }
  return req.originalUrl || req.url || req.path || "unknown";
}

export function requestLogging(req, res, next) {
  const startNs = process.hrtime.bigint();

  res.on("finish", () => {
    const endNs = process.hrtime.bigint();
    const latencyMs = Number(endNs - startNs) / 1_000_000;
    const identity = getIdentityContext(req);

    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        route: resolveRoute(req),
        status: res.statusCode,
        latencyMs: Number(latencyMs.toFixed(3)),
        userId: identity.userId,
        clientId: identity.clientId,
        tenantId: identity.tenantId,
      },
      "request completed"
    );
  });

  next();
}

export function createInFlightTracker(counterRef) {
  return function inFlightTracker(req, res, next) {
    counterRef.count += 1;
    let completed = false;

    const decrement = () => {
      if (!completed && counterRef.count > 0) {
        completed = true;
        counterRef.count -= 1;
      }
    };

    res.on("finish", decrement);
    res.on("close", decrement);
    next();
  };
}
