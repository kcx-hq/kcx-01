import AppError from "../../../../errors/AppError.js";

export const INQUIRY_TRANSITION_TABLE = Object.freeze({
  PENDING: Object.freeze({
    ACCEPTED: Object.freeze({
      allowed: true,
      code: "INQUIRY_TRANSITION_ALLOWED",
      reason: "Pending inquiry can be accepted",
    }),
    REJECTED: Object.freeze({
      allowed: true,
      code: "INQUIRY_TRANSITION_ALLOWED",
      reason: "Pending inquiry can be rejected",
    }),
  }),
  ACCEPTED: Object.freeze({
    ACCEPTED: Object.freeze({
      allowed: true,
      code: "INQUIRY_TRANSITION_IDEMPOTENT",
      reason: "Already accepted",
    }),
    REJECTED: Object.freeze({
      allowed: false,
      code: "INQUIRY_TRANSITION_CONFLICT",
      reason: "Accepted inquiry cannot be rejected",
    }),
  }),
  REJECTED: Object.freeze({
    ACCEPTED: Object.freeze({
      allowed: false,
      code: "INQUIRY_TRANSITION_CONFLICT",
      reason: "Rejected inquiry cannot be accepted",
    }),
    REJECTED: Object.freeze({
      allowed: true,
      code: "INQUIRY_TRANSITION_IDEMPOTENT",
      reason: "Already rejected",
    }),
  }),
});

export function getInquiryTransitionResult(fromStatus, toStatus) {
  const from = String(fromStatus || "").trim().toUpperCase();
  const to = String(toStatus || "").trim().toUpperCase();

  const decision = INQUIRY_TRANSITION_TABLE[from]?.[to];
  if (!decision) {
    return {
      allowed: false,
      code: "INQUIRY_TRANSITION_INVALID",
      reason: `Unsupported inquiry transition: ${from || "UNKNOWN"} -> ${to || "UNKNOWN"}`,
    };
  }

  return decision;
}

export function assertInquiryTransition(fromStatus, toStatus) {
  const result = getInquiryTransitionResult(fromStatus, toStatus);
  if (!result.allowed) {
    throw new AppError(409, "CONFLICT", "Conflict");
  }
  return result;
}

