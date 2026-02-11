// src/middleware/requestTiming.js
import crypto from "crypto";

export function requestTiming(req, res, next) {
  const start = process.hrtime.bigint();

  // correlation id
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();

  // expose to client / other services
  res.setHeader("x-request-id", req.requestId);

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;

    // route pattern is better than req.originalUrl (less noisy)
    const route = req.route?.path
      ? `${req.baseUrl || ""}${req.route.path}`
      : req.originalUrl;

    const log = {
      level: "info",
      type: "request",
      requestId: req.requestId,
      method: req.method,
      route,
      status: res.statusCode,
      duration_ms: Math.round(ms * 100) / 100,
    };

    console.log(JSON.stringify(log));
  });

  next();
}
