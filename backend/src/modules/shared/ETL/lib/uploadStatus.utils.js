import AppError from "../../../../errors/AppError.js";

export const BILLING_UPLOAD_TRANSITION_TABLE = Object.freeze({
  PENDING: Object.freeze({
    PENDING: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_IDEMPOTENT",
      reason: "Upload is already pending",
    }),
    PROCESSING: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_ALLOWED",
      reason: "Pending upload can enter processing",
    }),
    COMPLETED: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Pending upload cannot complete without processing",
    }),
    FAILED: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_ALLOWED",
      reason: "Pending upload can fail",
    }),
  }),
  PROCESSING: Object.freeze({
    PENDING: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Processing upload cannot return to pending",
    }),
    PROCESSING: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_IDEMPOTENT",
      reason: "Upload is already processing",
    }),
    COMPLETED: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_ALLOWED",
      reason: "Processing upload can complete",
    }),
    FAILED: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_ALLOWED",
      reason: "Processing upload can fail",
    }),
  }),
  COMPLETED: Object.freeze({
    PENDING: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Completed upload cannot return to pending",
    }),
    PROCESSING: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Completed upload cannot re-enter processing",
    }),
    COMPLETED: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_IDEMPOTENT",
      reason: "Upload is already completed",
    }),
    FAILED: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Completed upload cannot fail",
    }),
  }),
  FAILED: Object.freeze({
    PENDING: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Failed upload cannot return to pending",
    }),
    PROCESSING: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Failed upload cannot restart without a new upload row",
    }),
    COMPLETED: Object.freeze({
      allowed: false,
      code: "UPLOAD_STATUS_INVALID",
      reason: "Failed upload cannot complete directly",
    }),
    FAILED: Object.freeze({
      allowed: true,
      code: "UPLOAD_STATUS_IDEMPOTENT",
      reason: "Upload is already failed",
    }),
  }),
});

function normalizeStatus(value) {
  return String(value || "").trim().toUpperCase();
}

export function getBillingUploadTransitionResult(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  const result = BILLING_UPLOAD_TRANSITION_TABLE[from]?.[to];

  if (!result) {
    return {
      allowed: false,
      code: "UPLOAD_STATUS_UNKNOWN_TRANSITION",
      reason: `Unsupported upload status transition: ${from || "UNKNOWN"} -> ${to || "UNKNOWN"}`,
    };
  }

  return result;
}

export function assertBillingUploadTransition(fromStatus, toStatus) {
  const result = getBillingUploadTransitionResult(fromStatus, toStatus);
  if (!result.allowed) {
    throw new AppError(409, "CONFLICT", "Conflict");
  }
  return result;
}

