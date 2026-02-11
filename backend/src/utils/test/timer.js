// src/utils/timer.js
export function startSpan() {
  const t0 = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - t0) / 1e6; // ms
}

export function msSince(start) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}
