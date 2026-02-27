import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, Method } from "axios";
import { ApiError } from "./apiError";

type UnknownRecord = Record<string, unknown>;

const FALLBACK_ERROR_MESSAGE = "Something went wrong";

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: UnknownRecord;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  includeMeta?: boolean;
  suppressLegacyWarning?: boolean;
}

export interface ApiDataWithMeta<T> {
  data: T;
  meta?: UnknownRecord;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const isSuccessEnvelope = (value: unknown): value is ApiSuccess =>
  isRecord(value) && value["success"] === true && "data" in value;

export const isErrorEnvelope = (value: unknown): value is ApiErrorResponse =>
  isRecord(value) &&
  value["success"] === false &&
  isRecord(value["error"]) &&
  typeof value["error"]["code"] === "string" &&
  typeof value["error"]["message"] === "string";

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

const getResponseRequestId = (response: AxiosResponse<unknown> | undefined): string | undefined => {
  const fromEnvelope = isErrorEnvelope(response?.data) ? response.data.requestId : undefined;
  if (typeof fromEnvelope === "string" && fromEnvelope.trim() !== "") {
    return fromEnvelope;
  }

  const headers = response?.headers as
    | (Record<string, unknown> & { get?: (key: string) => string | null | undefined })
    | undefined;

  const fromGetter = typeof headers?.get === "function" ? headers.get("x-request-id") : undefined;
  if (fromGetter) return String(fromGetter);

  const fromHeader =
    headers?.["x-request-id"] ?? headers?.["X-Request-Id"] ?? headers?.["X-REQUEST-ID"];

  if (Array.isArray(fromHeader)) {
    return fromHeader[0];
  }

  return typeof fromHeader === "string" ? fromHeader : undefined;
};

const getLegacyMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;

  if (typeof payload["message"] === "string" && payload["message"].trim() !== "") {
    return payload["message"];
  }

  if (typeof payload["error"] === "string" && payload["error"].trim() !== "") {
    return payload["error"];
  }

  if (Array.isArray(payload["errors"]) && payload["errors"].length > 0) {
    const first = payload["errors"][0];
    if (typeof first === "string" && first.trim() !== "") {
      return first;
    }
    if (isRecord(first) && typeof first["message"] === "string") {
      return first["message"];
    }
  }

  return undefined;
};

const getFallbackStatusMessage = (status?: number): string => {
  if (!status) return FALLBACK_ERROR_MESSAGE;
  if (status === 401) return "Unauthorized. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "Requested resource was not found.";
  if (status >= 500) return "Server error. Please try again.";
  return FALLBACK_ERROR_MESSAGE;
};

export const normalizeErrorEnvelope = ({
  payload,
  status,
  requestId,
  details,
  cause,
}: {
  payload: unknown;
  status?: number;
  requestId?: string;
  details?: unknown;
  cause?: unknown;
}): ApiError | null => {
  if (!isErrorEnvelope(payload)) return null;

  const errorOptions = {
    code: payload.error.code,
    status,
    details: details ?? payload,
    cause,
    ...(requestId ? { requestId } : {}),
  };

  return new ApiError(payload.error.message || FALLBACK_ERROR_MESSAGE, {
    ...errorOptions,
  });
};

export const unwrapApiPayload = <T>(
  payload: unknown,
  includeMeta = false,
): T | ApiDataWithMeta<T> => {
  if (isSuccessEnvelope(payload)) {
    if (includeMeta) {
      const meta = isRecord(payload.meta) ? payload.meta : undefined;
      return meta
        ? { data: payload.data as T, meta }
        : { data: payload.data as T };
    }
    return payload.data as T;
  }

  if (includeMeta) {
    return { data: payload as T };
  }

  return payload as T;
};

const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError("Network error. Please check your connection.", {
        code: "NETWORK_ERROR",
        cause: error,
      });
    }

    const status = error.response.status;
    const payload = error.response.data;
    const requestId = getResponseRequestId(error.response);

    const envelopeError = normalizeErrorEnvelope({
      payload,
      status,
      requestId,
      details: payload,
      cause: error,
    });
    if (envelopeError) {
      return envelopeError;
    }

    const message = getLegacyMessage(payload) || error.message || getFallbackStatusMessage(status);
    const code =
      (isRecord(payload) && typeof payload["code"] === "string" && payload["code"]) ||
      (status ? `HTTP_${status}` : "HTTP_ERROR");

    const errorOptions = {
      code,
      status,
      details: payload,
      cause: error,
      ...(requestId ? { requestId } : {}),
    };

    return new ApiError(message, {
      ...errorOptions,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message || FALLBACK_ERROR_MESSAGE, {
      code: "UNEXPECTED_ERROR",
      cause: error,
    });
  }

  return new ApiError(FALLBACK_ERROR_MESSAGE, {
    code: "UNEXPECTED_ERROR",
    details: error,
  });
};

const shouldWarnLegacy = (payload: unknown, responseType?: AxiosRequestConfig["responseType"]): boolean => {
  if (!import.meta.env.DEV) return false;
  if (responseType === "blob" || responseType === "arraybuffer") return false;
  if (typeof Blob !== "undefined" && payload instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && payload instanceof ArrayBuffer) return false;
  return true;
};

const normalizeResponse = <T>(
  response: AxiosResponse<unknown>,
  includeMeta = false,
  suppressLegacyWarning = false,
): T | ApiDataWithMeta<T> => {
  const payload = response.data;

  const envelopeError = normalizeErrorEnvelope({
    payload,
    status: response.status,
    requestId: getResponseRequestId(response),
    details: payload,
  });
  if (envelopeError) {
    throw envelopeError;
  }

  if (!suppressLegacyWarning && shouldWarnLegacy(payload, response.config.responseType)) {
    const endpoint = response.config.url || "<unknown>";
    console.warn(`[api] Legacy response shape received from ${endpoint}.`);
  }

  return unwrapApiPayload<T>(payload, includeMeta);
};

const requestWithLegacyFallback = async <T>(config: ApiRequestConfig): Promise<T | ApiDataWithMeta<T>> => {
  const originalUrl = String(config.url || "");
  const upgradedUrl = rewriteApiUrl(originalUrl, "v1");

  try {
    const response = await http.request<unknown>({
      ...config,
      url: upgradedUrl,
      withCredentials: config.withCredentials ?? true,
    });

    return normalizeResponse<T>(response, config.includeMeta, config.suppressLegacyWarning);
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    const failedWith404 = axiosError?.response?.status === 404;
    const canFallback = upgradedUrl !== originalUrl && upgradedUrl.includes("/api/v1");

    if (failedWith404 && canFallback) {
      const fallbackUrl = rewriteApiUrl(upgradedUrl, "legacy");
      try {
        const fallbackResponse = await http.request<unknown>({
          ...config,
          url: fallbackUrl,
          withCredentials: config.withCredentials ?? true,
        });

        return normalizeResponse<T>(fallbackResponse, config.includeMeta, config.suppressLegacyWarning);
      } catch (fallbackError: unknown) {
        throw toApiError(fallbackError);
      }
    }

    throw toApiError(error);
  }
};

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T>;
export async function apiRequest<T>(
  config: ApiRequestConfig & { includeMeta: true },
): Promise<ApiDataWithMeta<T>>;
export async function apiRequest<T>(
  config: ApiRequestConfig,
): Promise<T | ApiDataWithMeta<T>> {
  try {
    return await requestWithLegacyFallback<T>(config);
  } catch (error: unknown) {
    const apiError = toApiError(error);
    if (apiError.requestId) {
      console.error("[api] request failed", {
        requestId: apiError.requestId,
        code: apiError.code,
        status: apiError.status,
      });
    }
    throw apiError;
  }
}

export const apiGet = async <T>(
  url: string,
  config: ApiRequestConfig = {},
): Promise<T> =>
  apiRequest<T>({
    ...config,
    url,
    method: "GET" as Method,
  });

export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config: ApiRequestConfig = {},
): Promise<T> =>
  apiRequest<T>({
    ...config,
    url,
    data,
    method: "POST" as Method,
  });

export const apiPut = async <T>(
  url: string,
  data?: unknown,
  config: ApiRequestConfig = {},
): Promise<T> =>
  apiRequest<T>({
    ...config,
    url,
    data,
    method: "PUT" as Method,
  });

