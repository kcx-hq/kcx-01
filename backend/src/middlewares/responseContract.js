
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCanonicalSuccessEnvelope(payload) {
  if (!isObject(payload)) return false;
  if (payload.success !== true) return false;
  if (!Object.prototype.hasOwnProperty.call(payload, "data")) return false;

  const keys = Object.keys(payload);
  return keys.every((key) => key === "success" || key === "data" || key === "meta");
}

function sanitizeMeta(meta) {
  if (!isObject(meta)) return undefined;
  const hasKeys = Object.keys(meta).length > 0;
  return hasKeys ? meta : undefined;
}

function normalizeSuccessPayload(payload) {
  if (isCanonicalSuccessEnvelope(payload)) {
    const envelope = {
      success: true,
      data: payload.data,
    };
    const safeMeta = sanitizeMeta(payload.meta);
    if (safeMeta) {
      envelope.meta = safeMeta;
    }
    return envelope;
  }

  if (isObject(payload) && payload.success === true) {
    const safeMeta = sanitizeMeta(payload.meta);
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      const envelope = {
        success: true,
        data: payload.data,
      };
      if (safeMeta) {
        envelope.meta = safeMeta;
      }
      return envelope;
    }

    const { success: _success, meta: _meta, ...rest } = payload;
    const envelope = {
      success: true,
      data: Object.keys(rest).length > 0 ? rest : null,
    };
    if (safeMeta) {
      envelope.meta = safeMeta;
    }
    return envelope;
  }

  return {
    success: true,
    data: payload,
  };
}

function sendSuccess(res, status, data, meta) {
  if (status === 204) {
    return res.status(204).end();
  }

  const envelope = {
    success: true,
    data,
  };

  const safeMeta = sanitizeMeta(meta);
  if (safeMeta) {
    envelope.meta = safeMeta;
  }

  return res.status(status).json(envelope);
}

export function successResponseContract(req, res, next) {
  const originalJson = res.json.bind(res);

  res.sendSuccess = (status, data = null, meta) => {
    if (status === 204) {
      return res.status(204).end();
    }

    const envelope = {
      success: true,
      data,
    };
    const safeMeta = sanitizeMeta(meta);
    if (safeMeta) {
      envelope.meta = safeMeta;
    }
    return res.status(status).json(envelope);
  };

  res.ok = (data = null, meta) => res.sendSuccess(200, data, meta);
  res.created = (data = null, meta) => res.sendSuccess(201, data, meta);
  res.accepted = (data = null, meta) => res.sendSuccess(202, data, meta);
  res.noContent = () => res.status(204).end();

  res.json = (payload) => {
    const status = Number(res.statusCode) || 200;

    if (status < 200 || status >= 300) {
      return originalJson(payload);
    }

    if (status === 204) {
      return res.status(204).end();
    }

    const normalizedPayload = normalizeSuccessPayload(payload);
    return originalJson(normalizedPayload);
  };

  next();
}

export { sendSuccess };
