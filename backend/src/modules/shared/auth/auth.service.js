import sequelize from "../../../config/db.config.js";
import AppError from "../../../errors/AppError.js";
import { Client, User } from "../../../models/index.js";
import {
  buildAuthIdentityKey,
  deriveClientName,
  getCapabilitiesForClient,
  normalizeEmail,
  resolveClientEmail,
} from "./auth.utils.js";
import { assertAuthVerificationTransition } from "./lib/authTransition.utils.js";

function requireValue(value, message) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new AppError(400, "VALIDATION_ERROR", message);
  }
}

export async function registerAuthIdentity(input = {}) {
  requireValue(input.email, "Invalid request");
  requireValue(input.password, "Invalid request");
  requireValue(input.full_name, "Invalid request");

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedClientEmail = resolveClientEmail(
    input.client_email,
    normalizedEmail,
  );
  const identityKey = buildAuthIdentityKey({
    email: normalizedEmail,
    clientEmail: normalizedClientEmail,
  });

  const tx = await sequelize.transaction();
  try {
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      transaction: tx,
    });

    if (existingUser) {
      throw new AppError(409, "CONFLICT", "Conflict");
    }

    let client = await Client.findOne({
      where: { email: normalizedClientEmail },
      transaction: tx,
    });

    if (!client) {
      client = await Client.create(
        {
          name: deriveClientName(input.client_name, normalizedEmail),
          email: normalizedClientEmail,
          is_active: true,
        },
        { transaction: tx },
      );
    }

    const user = await User.create(
      {
        client_id: client.id,
        full_name: String(input.full_name).trim(),
        email: normalizedEmail,
        password_hash: String(input.password),
        role: input.role || "USER",
        is_active: true,
        is_verified: Boolean(input.is_verified),
        verification_otp: input.verification_otp ?? null,
        verification_otp_expires: input.verification_otp_expires ?? null,
      },
      { transaction: tx },
    );

    await tx.commit();
    return { client, user, identityKey };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function getUserForClient({ userId, clientId }) {
  requireValue(userId, "Invalid request");
  requireValue(clientId, "Invalid request");

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  if (String(user.client_id) !== String(clientId)) {
    throw new AppError(
      403,
      "UNAUTHORIZED",
      "You do not have permission to perform this action",
    );
  }

  return user;
}

export async function setPasswordResetToken({ userId, tokenHash, expiresAt }) {
  requireValue(userId, "Invalid request");
  requireValue(tokenHash, "Invalid request");
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();
  return user;
}

export async function clearPasswordResetToken({ userId }) {
  requireValue(userId, "Invalid request");

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();
  return user;
}

export async function verifyUserOtp({ email, otp, now = new Date() }) {
  requireValue(email, "Invalid request");
  requireValue(otp, "Invalid request");

  const user = await User.findOne({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  if (user.is_verified) {
    assertAuthVerificationTransition("VERIFIED", "UNVERIFIED");
  }

  if (
    String(user.verification_otp || "") !== String(otp) ||
    !(user.verification_otp_expires instanceof Date) ||
    now > user.verification_otp_expires
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  user.is_verified = true;
  assertAuthVerificationTransition("UNVERIFIED", "VERIFIED");
  user.verification_otp = null;
  user.verification_otp_expires = null;
  await user.save();
  return user;
}

export async function getUserCapabilitiesSnapshot({ userId }) {
  requireValue(userId, "Invalid request");
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  return {
    userId: user.id,
    clientId: user.client_id,
    role: user.role,
    capabilities: getCapabilitiesForClient(user.client_id),
  };
}
