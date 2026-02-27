import AppError from "../../../../errors/AppError.js";

export const AUTH_VERIFICATION_TRANSITIONS = Object.freeze({
  UNVERIFIED: Object.freeze({
    VERIFIED: Object.freeze({
      allowed: true,
      code: "AUTH_VERIFICATION_ALLOWED",
      reason: "Unverified user can be verified",
    }),
  }),
  VERIFIED: Object.freeze({
    VERIFIED: Object.freeze({
      allowed: true,
      code: "AUTH_VERIFICATION_IDEMPOTENT",
      reason: "Already verified",
    }),
  }),
});

export function getAuthVerificationTransition(fromState, toState) {
  const from = String(fromState || "").trim().toUpperCase();
  const to = String(toState || "").trim().toUpperCase();
  const result = AUTH_VERIFICATION_TRANSITIONS[from]?.[to];

  if (!result) {
    return {
      allowed: false,
      code: "AUTH_VERIFICATION_INVALID",
      reason: `Unsupported auth verification transition: ${from || "UNKNOWN"} -> ${to || "UNKNOWN"}`,
    };
  }

  return result;
}

export function assertAuthVerificationTransition(fromState, toState) {
  const result = getAuthVerificationTransition(fromState, toState);
  if (!result.allowed) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }
  return result;
}

