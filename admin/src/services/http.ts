type UnknownRecord = Record<string, unknown>;

const FALLBACK_ERROR_MESSAGE = "Something went wrong";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: UnknownRecord;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
}

export class HttpError extends Error {
  code: string;
  status?: number;
  requestId?: string;
  details?: unknown;

  constructor(
    message: string,
    options: { code: string; status?: number; requestId?: string; details?: unknown },
  ) {
    super(message);
    this.name = "HttpError";
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

interface ApiRequestConfig extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const isSuccessEnvelope = (value: unknown): value is ApiSuccess =>
  isRecord(value) && value.success === true && "data" in value;

const isErrorEnvelope = (value: unknown): value is ApiErrorEnvelope =>
  isRecord(value) &&
  value.success === false &&
  isRecord(value.error) &&
  typeof value.error.code === "string" &&
  typeof value.error.message === "string";

const isAbsoluteUrl = (url: string): boolean => /^[a-z][a-z\d+\-.]*:\/\//i.test(url);

const rewritePathname = (pathname: string, target: "v1" | "legacy"): string => {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (target === "v1") {
    if (normalized === "/api") return "/api/v1";
    if (normalized.startsWith("/api/") && !normalized.startsWith("/api/v1/")) {
      return normalized.replace(/^\/api\//, "/api/v1/");
    }
    return normalized;
  }

  if (normalized === "/api/v1") return "/api";
  if (normalized.startsWith("/api/v1/")) {
    return normalized.replace(/^\/api\/v1\//, "/api/");
  }
  return normalized;
};

const rewriteApiUrl = (rawUrl: string, target: "v1" | "legacy"): string => {
  if (isAbsoluteUrl(rawUrl)) {
    const parsed = new URL(rawUrl);
    parsed.pathname = rewritePathname(parsed.pathname, target);
    return parsed.toString();
  }
  return rewritePathname(rawUrl, target);
};

const toMessage = (payload: unknown, fallback = FALLBACK_ERROR_MESSAGE): string => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (isRecord(payload)) {
    const message = payload.message;
    if (typeof message === "string" && message.trim()) return message;

    const error = payload.error;
    if (typeof error === "string" && error.trim()) return error;
    if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  return fallback;
};

const toRequestId = (response: Response, payload?: unknown): string | undefined => {
  if (isErrorEnvelope(payload) && typeof payload.requestId === "string" && payload.requestId.trim()) {
    return payload.requestId;
  }
  const fromHeader = response.headers.get("x-request-id");
  return fromHeader || undefined;
};

export const buildUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
): string => {
  const resolvedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${resolvedPath}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
};

const unwrapPayload = <T>(response: Response, payload: unknown): T => {
  if (isSuccessEnvelope(payload)) {
    return payload.data as T;
  }

  if (isErrorEnvelope(payload)) {
    throw new HttpError(payload.error.message || FALLBACK_ERROR_MESSAGE, {
      code: payload.error.code,
      status: response.status,
      requestId: toRequestId(response, payload),
      details: payload,
    });
  }

  if (response.ok) {
    return payload as T;
  }

  throw new HttpError(toMessage(payload), {
    code: `HTTP_${response.status || 500}`,
    status: response.status,
    requestId: toRequestId(response, payload),
    details: payload,
  });
};

const requestOnce = async <T>(
  url: string,
  config: ApiRequestConfig = {},
): Promise<{ ok: boolean; status: number; data?: T }> => {
  const { body, query, headers, credentials, ...rest } = config;
  const mergedHeaders = new Headers(headers);

  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (!mergedHeaders.has("Content-Type")) {
      mergedHeaders.set("Content-Type", "application/json");
    }
    finalBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(url, query), {
    ...rest,
    headers: mergedHeaders,
    credentials: credentials ?? "include",
    body: finalBody,
  });

  const payload = await response.json().catch(() => ({}));
  const data = unwrapPayload<T>(response, payload);
  return { ok: response.ok, status: response.status, data };
};

export async function apiRequest<T>(
  path: string,
  config: ApiRequestConfig = {},
): Promise<T> {
  const upgraded = rewriteApiUrl(path, "v1");
  try {
    const result = await requestOnce<T>(upgraded, config);
    return result.data as T;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404 && upgraded !== path) {
      const fallback = rewriteApiUrl(upgraded, "legacy");
      const result = await requestOnce<T>(fallback, config);
      return result.data as T;
    }
    throw error;
  }
}

export const apiGet = <T>(
  path: string,
  config: Omit<ApiRequestConfig, "method" | "body"> = {},
): Promise<T> => apiRequest<T>(path, { ...config, method: "GET" });

export const apiPost = <T>(
  path: string,
  body?: unknown,
  config: Omit<ApiRequestConfig, "method" | "body"> = {},
): Promise<T> => apiRequest<T>(path, { ...config, method: "POST", body });

export const apiPatch = <T>(
  path: string,
  body?: unknown,
  config: Omit<ApiRequestConfig, "method" | "body"> = {},
): Promise<T> => apiRequest<T>(path, { ...config, method: "PATCH", body });

export const apiDelete = <T>(
  path: string,
  body?: unknown,
  config: Omit<ApiRequestConfig, "method" | "body"> = {},
): Promise<T> => apiRequest<T>(path, { ...config, method: "DELETE", body });
