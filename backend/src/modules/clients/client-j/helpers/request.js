const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export function normalizeUploadIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
}

export function getUploadIdsFromRequest(req) {
  const raw =
    req.query?.uploadid ??
    req.query?.uploadId ??
    req.query?.uploadIds ??
    req.body?.uploadid ??
    req.body?.uploadId ??
    req.body?.uploadIds;

  return normalizeUploadIds(raw);
}

export function parseJsonParam(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toUtcStartOfDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

export function toUtcEndOfDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

export function getDateRangeFromRequest(req) {
  const startDate = parseIsoDate(req.query?.startDate ?? req.body?.startDate);
  const endDate = parseIsoDate(req.query?.endDate ?? req.body?.endDate);

  if (!startDate && !endDate) return { startDate: null, endDate: null };

  const normalizedStart = startDate ? toUtcStartOfDay(startDate) : null;
  const normalizedEnd = endDate ? toUtcEndOfDay(endDate) : null;

  return {
    startDate: normalizedStart,
    endDate: normalizedEnd,
  };
}

export function getCommonFilters(req) {
  return {
    provider: req.query?.provider ?? req.body?.provider ?? "All",
    service: req.query?.service ?? req.body?.service ?? "All",
    region: req.query?.region ?? req.body?.region ?? "All",
    search: req.query?.search ?? req.body?.search ?? "",
  };
}

export function getPagination(req, defaults = {}) {
  const defaultLimit = toFiniteNumber(defaults.limit, 50);
  const defaultPage = toFiniteNumber(defaults.page, 1);
  const maxLimit = toFiniteNumber(defaults.maxLimit, 500);

  const page = Math.max(1, parseInt(req.query?.page ?? req.body?.page ?? defaultPage, 10) || 1);
  const requestedLimit = parseInt(
    req.query?.limit ?? req.body?.limit ?? defaultLimit,
    10
  );
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit || defaultLimit));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy: req.query?.sortBy ?? req.body?.sortBy ?? null,
    sortOrder: String(req.query?.sortOrder ?? req.body?.sortOrder ?? "desc").toLowerCase(),
  };
}

export function getNumericParam(req, key, fallback = 0) {
  return toFiniteNumber(req.query?.[key] ?? req.body?.[key], fallback);
}

