import AppError from "../../../../errors/AppError.js";

export const CHAT_SESSION_TRANSITION_TABLE = Object.freeze({
  active: Object.freeze({
    active: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_IDEMPOTENT",
      reason: "Session already active",
    }),
    completed: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_ALLOWED",
      reason: "Active session can be completed",
    }),
    abandoned: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_ALLOWED",
      reason: "Active session can be abandoned",
    }),
  }),
  completed: Object.freeze({
    active: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_ALLOWED",
      reason: "Completed session can be restarted",
    }),
    completed: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_IDEMPOTENT",
      reason: "Session already completed",
    }),
    abandoned: Object.freeze({
      allowed: false,
      code: "CHAT_SESSION_CONFLICT",
      reason: "Completed session cannot become abandoned",
    }),
  }),
  abandoned: Object.freeze({
    active: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_ALLOWED",
      reason: "Abandoned session can be restarted",
    }),
    abandoned: Object.freeze({
      allowed: true,
      code: "CHAT_SESSION_IDEMPOTENT",
      reason: "Session already abandoned",
    }),
    completed: Object.freeze({
      allowed: false,
      code: "CHAT_SESSION_CONFLICT",
      reason: "Abandoned session cannot be completed directly",
    }),
  }),
});

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function getChatSessionTransitionResult(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  const result = CHAT_SESSION_TRANSITION_TABLE[from]?.[to];

  if (!result) {
    return {
      allowed: false,
      code: "CHAT_SESSION_INVALID",
      reason: `Unsupported chat session transition: ${from || "unknown"} -> ${to || "unknown"}`,
    };
  }

  return result;
}

export function assertChatSessionTransition(fromStatus, toStatus) {
  const result = getChatSessionTransitionResult(fromStatus, toStatus);
  if (!result.allowed) {
    throw new AppError(409, "CONFLICT", "Conflict");
  }
  return result;
}

export function buildChatMessageCommandKey({
  sessionId,
  message,
  messageId,
}) {
  const normalizedSessionId = String(sessionId || "").trim();
  const normalizedMessage = String(message || "").trim().toLowerCase();
  const normalizedMessageId = String(messageId || "").trim() || "none";
  return `${normalizedSessionId}::${normalizedMessageId}::${normalizedMessage}`;
}

