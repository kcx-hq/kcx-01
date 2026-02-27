import { describe, expect, it } from "vitest";
import { CAPABILITIES_MAP } from "../../../src/modules/shared/capabilities/capabilities.map.js";
import {
  buildAuthPayload,
  canRolePerform,
  deriveClientName,
  getCapabilitiesForClient,
  isValidProfileName,
  normalizeEmail,
  resolveClientEmail,
} from "../../../src/modules/shared/auth/auth.utils.js";

describe("auth.utils", () => {
  describe("normalizeEmail", () => {
    it.each([
      ["USER@EXAMPLE.COM", "user@example.com"],
      ["  Admin@Company.IO  ", "admin@company.io"],
      ["", ""],
      [null, ""],
    ])("normalizes %p -> %p", (input, expected) => {
      expect(normalizeEmail(input)).toBe(expected);
    });
  });

  describe("resolveClientEmail", () => {
    it.each([
      ["client@corp.com", "user@corp.com", "client@corp.com"],
      ["  CLIENT@Corp.Com ", "user@corp.com", "client@corp.com"],
      ["", "user@corp.com", "user@corp.com"],
      [undefined, "user@corp.com", "user@corp.com"],
    ])("resolves client email for %p", (clientEmail, normalizedEmail, expected) => {
      expect(resolveClientEmail(clientEmail, normalizedEmail)).toBe(expected);
    });
  });

  describe("deriveClientName", () => {
    it("uses explicit client name when present", () => {
      expect(deriveClientName("K and Co", "owner@kandco.com")).toBe("K and Co");
    });

    it("derives client name from normalized email domain", () => {
      expect(deriveClientName("", "admin@acme.io")).toBe("acme");
    });

    it("falls back to default client when domain cannot be derived", () => {
      expect(deriveClientName("", "invalid-email")).toBe("Default Client");
    });
  });

  describe("isValidProfileName", () => {
    it.each([
      ["John Doe", true],
      ["  Jane  ", true],
      ["", false],
      ["   ", false],
      [null, false],
    ])("validates profile name %p", (input, expected) => {
      expect(isValidProfileName(input)).toBe(expected);
    });
  });

  it("builds JWT auth payload from user shape", () => {
    expect(
      buildAuthPayload({
        id: "user-1",
        role: "admin",
        client_id: "client-1",
        email: "ignored@example.com",
      }),
    ).toEqual({
      id: "user-1",
      role: "admin",
      client_id: "client-1",
    });
  });

  it("returns client-specific capabilities when mapping exists", () => {
    const clientId = "980e9cf4-64f2-419b-ab01-e184e470aa4b";
    expect(getCapabilitiesForClient(clientId)).toBe(CAPABILITIES_MAP[clientId]);
  });

  it("falls back to core capabilities for unknown clients", () => {
    expect(getCapabilitiesForClient("unknown-client")).toBe(CAPABILITIES_MAP.core);
  });

  describe("canRolePerform", () => {
    it.each([
      ["admin", "read", true],
      ["admin", "manage", true],
      ["user", "write", false],
      ["viewer", "read", true],
      ["unknown", "read", true],
      ["unknown", "manage", false],
    ])("checks policy for role=%p action=%p", (role, action, expected) => {
      expect(canRolePerform(role, action)).toBe(expected);
    });
  });
});
