import bcrypt from "bcrypt";
import { describe, expect, it, beforeEach } from "vitest";
import { CAPABILITIES_MAP } from "../../../src/modules/shared/capabilities/capabilities.map.js";
import {
  clearPasswordResetToken,
  getUserCapabilitiesSnapshot,
  getUserForClient,
  registerAuthIdentity,
  setPasswordResetToken,
  verifyUserOtp,
} from "../../../src/modules/shared/auth/auth.service.js";
import { User } from "../../../src/models/index.js";
import {
  createClientFixture,
  createUserFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("auth integration service", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("creates client and user with hashed password", async () => {
    const { client, user } = await registerAuthIdentity({
      email: "Engineer@One.Example",
      password: "StrongPass#1",
      full_name: "Test Engineer",
      role: "USER",
      client_name: "One Inc",
      client_email: "ops@one.example",
      verification_otp: "123456",
      verification_otp_expires: new Date("2030-01-01T00:00:00.000Z"),
    });

    expect(client.email).toBe("ops@one.example");
    expect(user.email).toBe("engineer@one.example");
    expect(user.client_id).toBe(client.id);
    expect(user.password_hash).not.toBe("StrongPass#1");
    await expect(
      bcrypt.compare("StrongPass#1", user.password_hash),
    ).resolves.toBe(true);
  });

  it("reuses existing client by normalized client email", async () => {
    const existingClient = await createClientFixture({
      name: "Acme",
      email: "billing@acme.io",
    });

    const { client } = await registerAuthIdentity({
      email: "owner@acme.io",
      password: "StrongPass#2",
      full_name: "Acme Owner",
      role: "ADMIN",
      client_email: " Billing@Acme.IO ",
    });

    expect(client.id).toBe(existingClient.id);
    await expect(User.count()).resolves.toBe(1);
  });

  it("rejects duplicate email with conflict and keeps row count unchanged", async () => {
    await registerAuthIdentity({
      email: "duplicate@tenant.io",
      password: "StrongPass#3",
      full_name: "Primary User",
      role: "USER",
      client_email: "tenant@tenant.io",
    });

    const beforeCount = await User.count();

    await expect(
      registerAuthIdentity({
        email: "duplicate@tenant.io",
        password: "StrongPass#4",
        full_name: "Secondary User",
        role: "USER",
        client_email: "tenant@tenant.io",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      safeMessage: "Conflict",
    });

    await expect(User.count()).resolves.toBe(beforeCount);
  });

  it("returns scoped user when client matches", async () => {
    const user = await createUserFixture();
    const scoped = await getUserForClient({
      userId: user.id,
      clientId: user.client_id,
    });

    expect(scoped.id).toBe(user.id);
  });

  it("blocks cross-client lookup and leaves user data unchanged", async () => {
    const user = await createUserFixture({
      full_name: "Protected Name",
    });
    const otherClient = await createClientFixture();

    await expect(
      getUserForClient({
        userId: user.id,
        clientId: otherClient.id,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });

    const reloaded = await User.findByPk(user.id);
    expect(reloaded.full_name).toBe("Protected Name");
  });

  it("sets and clears password reset token fields", async () => {
    const user = await createUserFixture();
    const expiresAt = new Date("2031-04-02T10:00:00.000Z");

    await setPasswordResetToken({
      userId: user.id,
      tokenHash: "token-hash-1",
      expiresAt,
    });

    let reloaded = await User.findByPk(user.id);
    expect(reloaded.resetPasswordTokenHash).toBe("token-hash-1");
    expect(new Date(reloaded.resetPasswordExpiresAt).toISOString()).toBe(
      expiresAt.toISOString(),
    );

    await clearPasswordResetToken({ userId: user.id });

    reloaded = await User.findByPk(user.id);
    expect(reloaded.resetPasswordTokenHash).toBeNull();
    expect(reloaded.resetPasswordExpiresAt).toBeNull();
  });

  it("verifies OTP and clears verification fields", async () => {
    const user = await createUserFixture({
      email: "verify@tenant.io",
      verification_otp: "654321",
      verification_otp_expires: new Date("2035-01-01T00:00:00.000Z"),
      is_verified: false,
    });

    const verified = await verifyUserOtp({
      email: user.email,
      otp: "654321",
      now: new Date("2030-01-01T00:00:00.000Z"),
    });

    expect(verified.is_verified).toBe(true);
    expect(verified.verification_otp).toBeNull();
    expect(verified.verification_otp_expires).toBeNull();
  });

  it("rejects invalid OTP and preserves existing verification state", async () => {
    const user = await createUserFixture({
      email: "otp@tenant.io",
      verification_otp: "111111",
      verification_otp_expires: new Date("2035-01-01T00:00:00.000Z"),
      is_verified: false,
    });

    await expect(
      verifyUserOtp({
        email: user.email,
        otp: "999999",
        now: new Date("2030-01-01T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });

    const reloaded = await User.findByPk(user.id);
    expect(reloaded.is_verified).toBe(false);
    expect(reloaded.verification_otp).toBe("111111");
  });

  it("returns capability snapshot using DB user role and client", async () => {
    const mappedClientId = "980e9cf4-64f2-419b-ab01-e184e470aa4b";
    await createClientFixture({
      id: mappedClientId,
      name: "Mapped Client",
      email: "mapped@client.io",
    });
    const user = await createUserFixture({
      client_id: mappedClientId,
      role: "ADMIN",
      email: "admin@mapped.io",
    });

    const snapshot = await getUserCapabilitiesSnapshot({ userId: user.id });

    expect(snapshot.role).toBe("ADMIN");
    expect(snapshot.clientId).toBe(mappedClientId);
    expect(snapshot.capabilities).toEqual(CAPABILITIES_MAP[mappedClientId]);
  });
});
