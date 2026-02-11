// src/middleware/perfBucket.js
export function perfBucket(req, _res, next) {
  req.perf = {
    db_ms: 0,
    http_ms: 0,
    cpu_ms: 0, // optional if you measure specific CPU blocks
    notes: [],
  };
  next();
}
