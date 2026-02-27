const DEFAULT_WORKER_UPLOADED_BY = "00000000-0000-0000-0000-000000000001";
const DEFAULT_MIN_SLEEP_MS = 10_000;

function toTimeValue(value) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return parsed.getTime();
}

export function isPollCandidate(integration) {
  return Boolean(
    integration &&
      integration.enabled === true &&
      String(integration.clientid || "").trim() &&
      String(integration.bucket || "").trim(),
  );
}

export function sortIntegrationsForPolling(integrations = []) {
  return [...integrations].sort((left, right) => {
    const leftTime = toTimeValue(left?.lastpolledat);
    const rightTime = toTimeValue(right?.lastpolledat);

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });
}

export function buildPollJobPayload(integration = {}) {
  return {
    clientid: integration.clientid,
    Bucket: integration.bucket,
    prefix: integration.prefix,
    uploadedby: DEFAULT_WORKER_UPLOADED_BY,
  };
}

export function toWorkerErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Unknown worker error");
}

export function computeWorkerSleepMs({
  intervalMs,
  startedAtMs,
  nowMs = Date.now(),
  minimumMs = DEFAULT_MIN_SLEEP_MS,
}) {
  const safeInterval = Number(intervalMs) > 0 ? Number(intervalMs) : minimumMs;
  const safeStartedAt = Number(startedAtMs) > 0 ? Number(startedAtMs) : nowMs;
  const elapsed = Math.max(0, nowMs - safeStartedAt);
  return Math.max(minimumMs, safeInterval - elapsed);
}
