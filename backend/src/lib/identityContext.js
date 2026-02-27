function normalizeValue(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

export function getIdentityContext(req) {
  const user = req.user || {};

  const userId = normalizeValue(user.id || user.userId || req.userId);
  const clientId = normalizeValue(
    user.client_id || user.clientId || req.client_id || req.clientId
  );
  const tenantId = normalizeValue(user.tenant_id || user.tenantId || user.orgId);

  return {
    userId,
    clientId,
    tenantId,
  };
}

