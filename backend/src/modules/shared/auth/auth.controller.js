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
export const signUp = async (req, res) => {
  try {
    const { email, password, full_name, role, client_name, client_email } =
      req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        message: "Email, password, full name, and role are required",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedClientEmail = client_email
      ? client_email.toLowerCase().trim()
      : normalizedEmail;

    // 1. Generate verification OTP ONCE
    const { otp, expires } = generateVerificationOTP();

    let user;

    // 2. Check existing user
    const existingUser = await userService.getUserByEmail(normalizedEmail);

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

      await sendVerificationEmail(
        existingUser.email,
        existingUser.full_name,
        otp,
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
    } else {
      // 3. Check or create client
      const client =
        (await clientService.getClientByEmail(normalizedClientEmail)) ??
        (await clientService.createClient({
          name:
            client_name ||
            normalizedEmail.split("@")[1]?.split(".")[0] ||
            "Default Client",
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
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    /* 4. Check password */
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
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
      return res.status(403).json({
        message:
          "OTP sent on registered Email.Please verify your email before logging in.",
      });
    }
    /* 5. Generate JWT */
    const payload = { id: user.id, role: user.role, client_id: user.client_id };
    const token = generateJWT(payload);

    /* 6. Set cookie */
    // For cross-site deployments (frontend on Vercel, backend on Render) we need SameSite=None and Secure=true in production
    res.cookie("kandco_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    /* 7. Check if user has existing upload */
    const existingUpload = await BillingUpload.findOne({
      where: { uploadedby: user.id },
    });
    const hasUploaded = !!existingUpload;

    /* 8. Response */
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
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if user has existing upload
    const existingUpload = await BillingUpload.findOne({
      where: { uploadedby: user.id },
    });
    const hasUploaded = !!existingUpload;

    const caps = CAPABILITIES_MAP[req.client_id] || CAPABILITIES_MAP.core;
    res.json({
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
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name } = req.body;
    const userId = req.user.id;

    if (!full_name || full_name.trim() === "") {
      return res.status(400).json({ message: "Full name is required" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.full_name = full_name.trim();
    await user.save();

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
    sameSite: "none",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userService.getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.is_verified) {
      return res.status(400).json({ message: "User already verified" });
    }
    if (
      user.verification_otp !== otp ||
      new Date() > user.verification_otp_expires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.is_verified = true;
    user.verification_otp = null;
    user.verification_otp_expires = null;
    await user.save();
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return same message (anti user-enum)
    let genericMsg = {
      message: "A reset link has been sent to your email.",
    };

    if (!email) return res.status(200).json(genericMsg);

    const user = await User.findOne({
      where: {
        email: email.toLowerCase().trim()
      },
    });

    if (!user) return res.status(200).json({ message: "User not exist" });

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
    });

    return res.status(200).json(genericMsg);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
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
      return res
        .status(400)
        .json({ message: "Reset link is invalid or expired." });
    }

    // ✅ Update password (your field is password_hash)
    // You can hash manually OR just set password_hash and let your beforeUpdate hook hash it.
    // Option A (hash manually):
    user.password_hash = password;

    // Clear token fields
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password reset successful. Please login." });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
