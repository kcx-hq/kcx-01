import * as userService from "../user/user.service.js";
import * as clientService from "../client.service.js";
import { isValidEmail } from "../../../utils/emailValidation.js";
import bcrypt from "bcrypt";
import { generateJWT } from "../../../utils/jwt.js";
import { generateVerificationOTP } from "../../../utils/generateVerificationOTP.js";
import { sendVerificationEmail, sendEmail } from "../../../utils/sendEmail.js";
import { BillingUpload, User } from "../../../models/index.js";
import { CAPABILITIES_MAP } from "../../shared/capabilities/capabilities.map.js";
import crypto from "crypto";
import { Op } from "sequelize";
import { msSince } from "../../../utils/test/timer.js";

export const signUp = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    const { email, password, full_name, role, client_name, client_email } =
      req.body;

    /* 0) Basic validation */
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        message: "Email, password, full name, and role are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedClientEmail = client_email
      ? client_email.toLowerCase().trim()
      : normalizedEmail;

    mark("after normalize + validate");

    /* 1) Generate verification OTP */
    const { otp, expires } = generateVerificationOTP();
    mark("after generate otp");

    /* 2) Check existing user */
    const existingUser = await userService.getUserByEmail(normalizedEmail);
    mark("after check existing user");

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(409).json({
          message: "User already exists",
        });
      }

      // Re-send verification for unverified user
      existingUser.verification_otp = otp;
      existingUser.verification_otp_expires = expires;
      await existingUser.save();
      mark("after update existing unverified user");

      await sendVerificationEmail(
        existingUser.email,
        existingUser.full_name,
        otp,
      );
      mark("after send verification email (existing user)");

      console.log(
        JSON.stringify({
          type: "signup_breakdown",
          requestId: req.requestId,
          marks,
          total_ms: msSince(t0),
          path: "existing_unverified_user",
        }),
      );

      return res.status(200).json({
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
    }

    /* 3) Check or create client */
    const clientLookup = await clientService.getClientByEmail(
      normalizedClientEmail,
    );
    mark("after get client by email");

    const client =
      clientLookup ??
      (await clientService.createClient({
        name:
          client_name ||
          normalizedEmail.split("@")[1]?.split(".")[0] ||
          "Default Client",
        email: normalizedClientEmail,
      }));

    mark(clientLookup ? "after client found" : "after client created");

    /* 4) Create user */
    const user = await userService.createUser({
      client_id: client.id,
      email: normalizedEmail,
      password_hash: password, // assuming service hashes it (recommended)
      role,
      full_name,
      verification_otp: otp,
      verification_otp_expires: expires,
      is_verified: false,
    });
    mark("after create user");

    /* 5) Send verification email */
    sendVerificationEmail(user.email, user.full_name, otp).catch((err) =>
      console.error("sendVerificationEmail failed:", err),
    );
    mark("after send verification email (new user)");

    console.log(
      JSON.stringify({
        type: "signup_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        path: clientLookup ? "new_user_existing_client" : "new_user_new_client",
      }),
    );

    /* 6) Response */
    return res.status(201).json({
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
    console.error("Signup error:", error);

    // still log timings even on failure
    console.log(
      JSON.stringify({
        type: "signup_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: error?.message,
      }),
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const signIn = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));
  try {
    const { email, password } = req.body;

    console.log(email, password);

    /* 1. Required fields */
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    /* 2. Normalize email */
    const normalizedEmail = email.toLowerCase().trim();
    /* 3. Find user */
    const user = await userService.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    mark("after find user");
    /* 4. Check password */
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    mark("after check password bcrypt compare");
    if (!user.is_verified) {
      const { otp, expires } = generateVerificationOTP();
      user.verification_otp = otp;
      user.verification_otp_expires = expires;
      await user.save();
      await sendVerificationEmail(user.email, user.full_name, otp);
      return res.status(403).json({
        message:
          "OTP sent on registered Email.Please verify your email before logging in.",
      });
    }

    /* 5. Generate JWT */
    const payload = { id: user.id, role: user.role, client_id: user.client_id  , has_uploaded: user.has_uploaded};
    const token = generateJWT(payload);

    mark("after generate jwt");
    /* 6. Set cookie */
    // For cross-site deployments (frontend on Vercel, backend on Render) we need SameSite=None and Secure=true in production
    res.cookie("kandco_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    mark("after fetching existing upload");

    console.log(
      JSON.stringify({
        type: "signin_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
      }),
    );
    /* 8. Response */
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      hasUploaded: user.has_uploaded,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getUser = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    /* 1) Fetch user */
    const user = await userService.getUserById(req.user.id);
    mark("after get user by id");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /* 3) Resolve capabilities */
    const caps = CAPABILITIES_MAP[req.client_id] || CAPABILITIES_MAP.core;
    mark("after resolve capabilities");

    /* 4) Log breakdown */
    console.log(
      JSON.stringify({
        type: "getUser_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
      }),
    );

    /* 5) Response */
    return res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      is_premium: user.is_premium || false,
      caps,
      createdAt: user.createdAt,
      hasUploaded: user.has_uploaded,
    });
  } catch (err) {
    console.error("getUser error:", err);

    // still log timings on error
    console.log(
      JSON.stringify({
        type: "getUser_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: err.message,
      }),
    );

    return res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    const { full_name } = req.body;
    const userId = req.user.id;

    if (!full_name || full_name.trim() === "") {
      return res.status(400).json({ message: "Full name is required" });
    }
    const trimmedName = full_name.trim();
    mark("after validate input");

    const [count, rows] = await User.update(
      { full_name: trimmedName },
      {
        where: { id: userId },
        returning: ["id", "email", "full_name", "role", "is_active", "createdAt"],
      },
    );
    mark("after update returning");

    if (!count) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    console.log(
      JSON.stringify({
        type: "updateProfile_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        mode: "single_query_update",
      }),
    );

    return res.status(200).json({
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
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  // Ensure we clear the same cookie attributes when logging out
  res.clearCookie("kandco_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const verifyEmail = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    const { email, otp } = req.body;

    /* 1) Validate + normalize */
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    mark("after normalize input");

    /* 2) Single atomic UPDATE */
    const [updatedCount] = await User.update(
      {
        is_verified: true,
        verification_otp: null,
        verification_otp_expires: null,
      },
      {
        where: {
          email: normalizedEmail,
          is_verified: false,
          verification_otp: otp,
          verification_otp_expires: {
            [Op.gt]: new Date(),
          },
        },
      },
    );
    mark("after update verify user");

    /* 3) No rows updated → invalid / expired / already verified */
    if (updatedCount === 0) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    /* 4) Log breakdown */
    console.log(
      JSON.stringify({
        type: "verifyEmail_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        mode: "single_query_update",
      }),
    );

    /* 5) Response */
    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    console.log(
      JSON.stringify({
        type: "verifyEmail_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: error.message,
      }),
    );

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    const { email } = req.body;

    const genericMsg = {
      message: "A reset link has been sent to your email.",
    };

    if (!email) {
      mark("after validate input");
      return res.status(200).json(genericMsg);
    }

    const normalizedEmail = email.toLowerCase().trim();
    mark("after normalize email");

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });
    mark("after find user");

    // Anti user-enum: still return generic response
    if (!user) {
      console.log(
        JSON.stringify({
          type: "forgotPassword_breakdown",
          requestId: req.requestId,
          marks,
          total_ms: msSince(t0),
          path: "user_not_found",
        }),
      );
      return res.status(200).json(genericMsg);
    }

    /* Generate token */
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    mark("after save reset token");

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // ✅ Send email ASYNC (do not block response)
    sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="background-color:#0a0a0c; padding:32px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
  <div style="max-width:520px; margin:0 auto; background-color:#121218; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px;">

    <h2 style="color:#ffffff; margin:0 0 12px; font-size:22px;">
      Reset your password
    </h2>

    <p style="color:#9CA3AF; font-size:14px; line-height:1.6; margin:0 0 20px;">
      We received a request to reset your password. Click the button below to set a new password.
      <br />
      <span style="color:#6B7280;">This link is valid for 15 minutes.</span>
    </p>

    <div style="text-align:center; margin:28px 0;">
      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          background-color:#8B2FC9;
          color:#ffffff;
          text-decoration:none;
          font-weight:700;
          padding:14px 26px;
          border-radius:14px;
          box-shadow:0 4px 14px rgba(139,47,201,0.45);
        "
      >
        Reset Password
      </a>
    </div>

    <p style="color:#9CA3AF; font-size:13px; line-height:1.6; margin:0;">
      If you didn’t request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:24px 0;" />

    <p style="color:#6B7280; font-size:12px; text-align:center; margin:0;">
      © ${new Date().getFullYear()} K and Co., All rights reserved
    </p>

  </div>
</div>

      `,
    }).catch((err) => {
      console.error("reset password email failed:", err);
    });
    mark("after enqueue reset email");

    console.log(
      JSON.stringify({
        type: "forgotPassword_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
      }),
    );

    return res.status(200).json(genericMsg);
  } catch (err) {
    console.error("Forgot password error:", err);

    console.log(
      JSON.stringify({
        type: "forgotPassword_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: err.message,
      }),
    );

    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    /* 1) Validate input */
    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    mark("after validate input");

    /* 2) Hash token + password */
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 10);
    mark("after hash password");

    /* 3) Single atomic UPDATE */
    const [updatedCount] = await User.update(
      {
        password_hash: passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
      {
        where: {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpiresAt: { [Op.gt]: new Date() },
        },
      }
    );
    mark("after update password");

    if (updatedCount === 0) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or expired." });
    }

    /* 4) Log breakdown */
    console.log(
      JSON.stringify({
        type: "resetPassword_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        mode: "single_query_update",
      })
    );

    return res
      .status(200)
      .json({ message: "Password reset successful. Please login." });
  } catch (err) {
    console.error("Reset password error:", err);

    console.log(
      JSON.stringify({
        type: "resetPassword_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: err.message,
      })
    );

    return res.status(500).json({ message: "Server error" });
  }
};

