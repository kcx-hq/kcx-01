// src/http/timedFetch.js
export async function timedFetch(req, url, options = {}) {
  const start = process.hrtime.bigint();
  try {
    return await fetch(url, options);
  } finally {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (req?.perf) req.perf.http_ms += ms;

    // optional: log slow external calls
    if (ms > 300) {
      console.log(
        JSON.stringify({
          type: "http_slow",
          requestId: req?.requestId,
          duration_ms: Math.round(ms * 100) / 100,
          url: String(url).slice(0, 300),
        })
      );
    }
  }
}
