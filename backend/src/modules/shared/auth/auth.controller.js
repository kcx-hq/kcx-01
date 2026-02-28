import * as userService from "../user/user.service.js";
import * as clientService from "../client.service.js";
import { UserRole } from "../../../models/UserRole.js";
import { isValidEmail } from "../../../utils/emailValidation.js";
import bcrypt from "bcrypt";
import { generateJWT } from "../../../utils/jwt.js";
import { generateVerificationOTP } from "../../../utils/generateVerificationOTP.js";
import { sendVerificationEmail, sendEmail } from "../../../utils/sendEmail.js";
import { BillingUpload, User, LoginAttempt } from "../../../models/index.js";
import { CAPABILITIES_MAP } from "../../shared/capabilities/capabilities.map.js";
import crypto from "crypto";
import { Op } from "sequelize";

const LOGIN_WINDOW_MS = 150000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 5 * 60 * 1000;

const buildLockoutResponse = (blockedUntil) => {
  const until = new Date(blockedUntil);
  const retryAfterSeconds = Math.max(0, Math.ceil((until.getTime() - Date.now()) / 1000));
  return {
    message: "Too many failed attempts. Try again later.",
    retry_after_seconds: retryAfterSeconds,
    blocked_until: until.toISOString(),
  };
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
};

const markFailedAttempt = async (email, ip) => {
  const now = new Date();
  const existing = await LoginAttempt.findOne({ where: { email, ip } });

  if (!existing) {
    const blocked_until =
      LOGIN_MAX_ATTEMPTS === 1
        ? new Date(now.getTime() + LOGIN_BLOCK_MS)
        : null;
    await LoginAttempt.create({
      email,
      ip,
      failed_count: 1,
      first_failed_at: now,
      last_failed_at: now,
      blocked_until,
    });
    return blocked_until;
  }

  const lastFailedAt = existing.last_failed_at;
  const withinWindow =
    lastFailedAt && now.getTime() - new Date(lastFailedAt).getTime() <= LOGIN_WINDOW_MS;

  const nextCount = withinWindow ? existing.failed_count + 1 : 1;
  const firstFailedAt = withinWindow ? existing.first_failed_at : now;
  const blocked_until =
    nextCount >= LOGIN_MAX_ATTEMPTS
      ? new Date(now.getTime() + LOGIN_BLOCK_MS)
      : null;

  await existing.update({
    failed_count: nextCount,
    first_failed_at: firstFailedAt,
    last_failed_at: now,
    blocked_until,
  });

  return blocked_until;
};

const clearAttempts = async (email, ip) => {
  await LoginAttempt.destroy({ where: { email, ip } });
};
export const signUp = async (req, res) => {
  try {
    const { email, password, full_name, role, client_name, client_email } =
      req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedClientEmail = resolveClientEmail(
      client_email,
      normalizedEmail,
    );

    // 1. Generate verification OTP ONCE
    const { otp, expires } = generateVerificationOTP();

    let user;

    // 2. Check existing user
    const existingUser = await userService.getUserByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.is_verified) {
        return next(new AppError(409, "CONFLICT", "Conflict"));
      }

      // Re-send verification for unverified user
      existingUser.verification_otp = otp;
      existingUser.verification_otp_expires = expires;
      await existingUser.save();

      await sendVerificationEmail(
        existingUser.email,
        existingUser.full_name,
        otp,
      );

      return res.ok({
        message:
          "User is already registered. Verify the email. Verification OTP resent. Please verify your email.",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          client_id: existingUser.client_id,
          createdAt: existingUser.createdAt,
        },
      });
    } else {
      // 3. Check or create client
      const client =
        (await clientService.getClientByEmail(normalizedClientEmail)) ??
        (await clientService.createClient({
          name: deriveClientName(client_name, normalizedEmail),
          email: normalizedClientEmail,
        }));

      // 4. Create user
      user = await userService.createUser({
        client_id: client.id,
        email: normalizedEmail,
        password_hash: password,
        role: role,
        full_name,
        verification_otp: otp,
        verification_otp_expires: expires,
        is_verified: false,
      });
    }

    // 5. Send verification email (ONLY ONCE)
    await sendVerificationEmail(user.email, user.full_name, otp);

    // 6. Response
    return res.created({
      message: "User registered successfully. Please verify your email.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Signup error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    /* 1. Required fields */
    if (!email || !password) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    /* 2. Normalize email */
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    const existingAttempt = await LoginAttempt.findOne({
      where: { email: normalizedEmail, ip },
    });
    if (existingAttempt?.blocked_until && new Date(existingAttempt.blocked_until) > new Date()) {
      return res.status(429).json(buildLockoutResponse(existingAttempt.blocked_until));
    }
    /* 3. Find user */
    const user = await userService.getUserByEmail(normalizedEmail);
    if (!user) {
      const blockedUntil = await markFailedAttempt(normalizedEmail, ip);
      if (blockedUntil) {
        return res.status(429).json(buildLockoutResponse(blockedUntil));
      }
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    /* 4. Check password */
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const blockedUntil = await markFailedAttempt(normalizedEmail, ip);
      if (blockedUntil) {
        return res.status(429).json(buildLockoutResponse(blockedUntil));
      }
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.is_verified) {
      const { otp, expires } = generateVerificationOTP();
      user.verification_otp = otp;
      user.verification_otp_expires = expires;
      await user.save();
      await sendVerificationEmail(user.email, user.full_name, otp);
      await clearAttempts(normalizedEmail, ip);
      return res.status(403).json({
        message:
          "OTP sent on registered Email.Please verify your email before logging in.",
      });
    }
    /* 5. Generate JWT */
    const payload = buildAuthPayload(user);
    const token = generateJWT(payload);

    /* 6. Set cookie */
    // For cross-site deployments (frontend on Vercel, backend on Render) we need SameSite=None and Secure=true in production
    res.cookie("kandco_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    /* 7. Check if user has existing upload */
    const existingUpload = await BillingUpload.findOne({
      where: { uploadedby: user.id },
    });
    const hasUploaded = !!existingUpload;

    /* 8. Response */
    await clearAttempts(normalizedEmail, ip);
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      hasUploaded,
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Login error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));

    // Check if user has existing upload
    const existingUpload = await BillingUpload.findOne({
      where: { uploadedby: user.id },
    });
    const hasUploaded = !!existingUpload;

    const caps = getCapabilitiesForClient(req.client_id);
    return res.ok({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      is_premium: user.is_premium || false,
      caps,
      createdAt: user.createdAt,
      hasUploaded,
    });
  } catch (err) {
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    const userId = req.user.id;

    if (!isValidProfileName(full_name)) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return next(new AppError(404, "NOT_FOUND", "Not found"));
    }

    user.full_name = full_name.trim();
    await user.save();

    return res.ok({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err, requestId: req.requestId }, "Update profile error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
};

export const logout = (req, res, _next) => {
  // Ensure we clear the same cookie attributes when logging out
  res.clearCookie("kandco_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.ok({ message: "Logged out successfully" });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await userService.getUserByEmail(normalizedEmail);

    if (!user) {
      return next(new AppError(404, "NOT_FOUND", "Not found"));
    }
    if (user.is_verified) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    if (
      user.verification_otp !== otp ||
      new Date() > user.verification_otp_expires
    ) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    user.is_verified = true;
    user.verification_otp = null;
    user.verification_otp_expires = null;
    await user.save();
    return res.ok({ message: "Email verified successfully" });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Email verification error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return same message (anti user-enum)
    let genericMsg = {
      message: "A reset link has been sent to your email.",
    };

    if (!email) return res.ok(genericMsg);

    const user = await User.findOne({
      where: {
        email: normalizeEmail(email)
      },
    });

    if (!user) return res.ok({ message: "User not exist" });

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Save hash + expiry (15 mins)
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="background-color:#f3fbf7; padding:32px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border:1px solid rgba(15,157,115,0.18); border-radius:16px; padding:28px;">

    <h2 style="color:#133a2d; margin:0 0 12px; font-size:22px;">
      Reset your password
    </h2>

    <p style="color:#5f7a70; font-size:14px; line-height:1.6; margin:0 0 20px;">
      We received a request to reset your password. Click the button below to set a new password.
      <br />
      <span style="color:#6d8379;">This link is valid for 15 minutes.</span>
    </p>

    <div style="text-align:center; margin:28px 0;">
      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          background-color:#0f9d73;
          color:#ffffff;
          text-decoration:none;
          font-weight:700;
          padding:14px 26px;
          border-radius:14px;
          box-shadow:0 4px 14px rgba(15,157,115,0.28);
        "
      >
        Reset Password
      </a>
    </div>

    <p style="color:#5f7a70; font-size:13px; line-height:1.6; margin:0;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <hr style="border:none; border-top:1px solid rgba(15,157,115,0.18); margin:24px 0;" />

    <p style="color:#6d8379; font-size:12px; text-align:center; margin:0;">
      (c) ${new Date().getFullYear()} K and Co., All rights reserved
    </p>

  </div>
</div>

      `,
    });

    return res.ok(genericMsg);
  } catch (err) {
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    if (password !== confirmPassword) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    // Hash incoming token to compare with DB
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    // Update password (your field is password_hash)
    // You can hash manually OR just set password_hash and let your beforeUpdate hook hash it.
    // Option A (hash manually):
    user.password_hash = password;

    // Clear token fields
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;

    await user.save();

    return res.ok({ message: "Password reset successful. Please login." });
  } catch (err) {
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
  }
};
