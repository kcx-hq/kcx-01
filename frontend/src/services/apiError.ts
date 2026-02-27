export interface ApiErrorOptions {
  code: string;
  status?: number;
  requestId?: string;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  code: string;
  status?: number;
  requestId?: string;
  details?: unknown;
  cause?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    if (typeof options.status === "number") {
      this.status = options.status;
    }
    if (typeof options.requestId === "string" && options.requestId.length > 0) {
      this.requestId = options.requestId;
    }
    if (options.details !== undefined) {
      this.details = options.details;
    }
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (isApiError(error)) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export const getApiRequestId = (error: unknown): string | undefined => {
  if (isApiError(error)) {
    return error.requestId;
  }
  return undefined;
};

export const getApiErrorMessageWithRequestId = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  const message = getApiErrorMessage(error, fallback);
  const requestId = getApiRequestId(error);
  return requestId ? `${message} (Request ID: ${requestId})` : message;
};
