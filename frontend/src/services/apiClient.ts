import type { AxiosRequestConfig } from "axios";
import { useDashboardStore } from "../store/Dashboard.store";
import { apiRequest } from "./http";
import type { ApiDataWithMeta, ApiRequestConfig } from "./http";

export class ApiClientError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

export interface CapabilityEndpointConfig {
  method?: string;
  path: string;
  responseType?: AxiosRequestConfig["responseType"];
  [key: string]: unknown;
}

export type CapabilityEndpoint = true | CapabilityEndpointConfig;

export interface CapabilityModule {
  enabled?: boolean;
  endpoints?: Record<string, CapabilityEndpoint>;
  [key: string]: unknown;
}

export interface Capabilities {
  apiBase?: string;
  dashboard?: string;
  modules?: Record<string, CapabilityModule>;
  [key: string]: unknown;
}

export interface ApiCallOptions {
  params?: Record<string, unknown>;
  responseType?: AxiosRequestConfig["responseType"];
  headers?: AxiosRequestConfig["headers"];
  data?: unknown;
  signal?: AbortSignal;
}

export interface ApiClientResponse {
  [key: string]: unknown;
}

export interface ApiClient {
  call: <T = ApiClientResponse>(
    moduleKey: string,
    endpointKey: string,
    options?: ApiCallOptions,
  ) => Promise<T>;
  callWithMeta: <T = ApiClientResponse>(
    moduleKey: string,
    endpointKey: string,
    options?: ApiCallOptions,
  ) => Promise<ApiDataWithMeta<T>>;
  getEndpoint: (
    moduleKey: string,
    endpointKey: string,
  ) => CapabilityEndpointConfig | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isCapabilities = (value: unknown): value is Capabilities =>
  isRecord(value);

const preferApiV1 = (value: string): string => {
  if (value === "/api") return "/api/v1";
  if (value.startsWith("/api/") && !value.startsWith("/api/v1/")) {
    return value.replace(/^\/api\//, "/api/v1/");
  }
  return value;
};

const joinPath = (base: string, path: string): string => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const getUploadIdsFromStore = (): string[] => {
  try {
    const ids = useDashboardStore.getState().uploadIds;
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

const createRequestConfig = (
  url: string,
  method: string,
  options: ApiCallOptions,
  endpoint: CapabilityEndpointConfig,
): ApiRequestConfig => {
  const uploadIds = getUploadIdsFromStore();
  const mergedParams: Record<string, unknown> = {
    ...(options.params || {}),
    ...(uploadIds.length > 0 ? { uploadIds: uploadIds.join(",") } : {}),
  };

  const config: ApiRequestConfig = {
    url,
    method,
    params: mergedParams,
  };

  if (options.signal) {
    config.signal = options.signal;
  }

  const responseType = endpoint.responseType || options.responseType;
  if (responseType) {
    config.responseType = responseType;
  }

  if (options.headers) {
    config.headers = options.headers;
  }

  if (options.data && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    config.data = options.data;
  }

  return config;
};

export function createApiClient(caps: Capabilities | null): ApiClient {
  const rawApiBase = caps?.apiBase || "/api/v1";
  const apiBase = preferApiV1(rawApiBase);

  function getEndpoint(moduleKey: string, endpointKey: string): CapabilityEndpointConfig | null {
    const mod = caps?.modules?.[moduleKey];
    if (!mod?.enabled) return null;

    const endpoint = mod?.endpoints?.[endpointKey];
    if (!endpoint) return null;

    if (endpoint === true) {
      return { method: "GET", path: `/${moduleKey}/${endpointKey}` };
    }

    if (isRecord(endpoint)) {
      return endpoint as CapabilityEndpointConfig;
    }

    return null;
  }

  async function call<T = ApiClientResponse>(
    moduleKey: string,
    endpointKey: string,
    options: ApiCallOptions = {},
  ): Promise<T> {
    const endpoint = getEndpoint(moduleKey, endpointKey);
    if (!endpoint) {
      throw new ApiClientError(`Endpoint not supported: ${moduleKey}.${endpointKey}`, "NOT_SUPPORTED");
    }

    const method = (endpoint.method || "GET").toUpperCase();
    const url = joinPath(apiBase, endpoint.path);
    const requestConfig = createRequestConfig(url, method, options, endpoint);

    return apiRequest<T>(requestConfig);
  }

  async function callWithMeta<T = ApiClientResponse>(
    moduleKey: string,
    endpointKey: string,
    options: ApiCallOptions = {},
  ): Promise<ApiDataWithMeta<T>> {
    const endpoint = getEndpoint(moduleKey, endpointKey);
    if (!endpoint) {
      throw new ApiClientError(`Endpoint not supported: ${moduleKey}.${endpointKey}`, "NOT_SUPPORTED");
    }

    const method = (endpoint.method || "GET").toUpperCase();
    const url = joinPath(apiBase, endpoint.path);
    const requestConfig = createRequestConfig(url, method, options, endpoint);

    return apiRequest<T>({
      ...requestConfig,
      includeMeta: true,
    }) as Promise<ApiDataWithMeta<T>>;
  }

  return { call, callWithMeta, getEndpoint };
}
