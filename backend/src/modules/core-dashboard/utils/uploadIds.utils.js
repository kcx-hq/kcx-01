export function normalizeUploadIds(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map(String).map((value) => value.trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

export function extractUploadIdsFromRequest(req) {
  return normalizeUploadIds(
    req.query?.uploadid ??
      req.query?.uploadId ??
      req.query?.uploadids ??
      req.query?.uploadIds ??
      req.body?.uploadid ??
      req.body?.uploadId ??
      req.body?.uploadIds,
  );
}

export function extractUploadIdsBodyFirst(req) {
  const bodyValue = req.body?.uploadIds ?? req.body?.uploadId;
  const queryValue = req.query?.uploadIds ?? req.query?.uploadId;
  return normalizeUploadIds(bodyValue ?? queryValue);
}
