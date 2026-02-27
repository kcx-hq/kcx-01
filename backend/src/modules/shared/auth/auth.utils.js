import { CAPABILITIES_MAP } from "../capabilities/capabilities.map.js";

const ROLE_POLICY = Object.freeze({
  admin: Object.freeze(["read", "write", "manage"]),
  user: Object.freeze(["read"]),
  viewer: Object.freeze(["read"]),
  system: Object.freeze(["read", "write", "manage"]),
});

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function buildAuthIdentityKey({ email, clientEmail }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedClientEmail = resolveClientEmail(clientEmail, normalizedEmail);
  return `${normalizedEmail}::${normalizedClientEmail}`;
}

export function resolveClientEmail(clientEmail, normalizedEmail) {
  const normalizedClientEmail = normalizeEmail(clientEmail);
  return normalizedClientEmail || normalizedEmail;
}

export function deriveClientName(clientName, normalizedEmail) {
  const explicitName = String(clientName || "").trim();
  if (explicitName) {
    return explicitName;
  }

  const derived = String(normalizedEmail || "")
    .split("@")[1]
    ?.split(".")[0];

  return derived || "Default Client";
}

export function isValidProfileName(fullName) {
  return typeof fullName === "string" && fullName.trim().length > 0;
}

export function buildAuthPayload(user) {
  return {
    id: user?.id,
    role: user?.role,
    client_id: user?.client_id,
  };
}

export function getCapabilitiesForClient(clientId) {
  return CAPABILITIES_MAP[clientId] || CAPABILITIES_MAP.core;
}

export function canRolePerform(role, action) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const normalizedAction = String(action || "").trim().toLowerCase();
  const allowedActions = ROLE_POLICY[normalizedRole] || ROLE_POLICY.user;
  return allowedActions.includes(normalizedAction);
}
