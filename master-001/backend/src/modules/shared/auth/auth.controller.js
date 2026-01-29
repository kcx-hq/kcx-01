import * as userService from "../user/user.service.js";
import * as clientService from "../client.service.js";
import { isValidEmail } from "../../../utils/emailValidation.js";
import bcrypt from "bcrypt";
import { generateJWT } from "../../../utils/jwt.js";
import { generateVerificationOTP } from "../../../utils/generateVerificationOTP.js";
import { sendVerificationEmail } from "../../../utils/sendEmail.js";
import { BillingUpload } from "../../../models/index.js";
import { CAPABILITIES_MAP } from "../../shared/capabilities/capabilities.map.js";

export const signUp = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      role,
      client_name,
      client_email
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        message: "Email, password, full name, and role are required"
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedClientEmail = client_email ? client_email.toLowerCase().trim() : normalizedEmail;

    // 1. Generate verification OTP ONCE
    const { otp, expires } = generateVerificationOTP();

    let user;

    // 2. Check existing user
    const existingUser = await userService.getUserByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(409).json({
          message: "User already exists"
        });
      }

      // Re-send verification for unverified user
      existingUser.verification_otp = otp;
      existingUser.verification_otp_expires = expires;
      await existingUser.save();

      await sendVerificationEmail(
        existingUser.email,
        existingUser.full_name,
        otp
      );

      return res.status(200).json({
        message: "User is already registered. Verify the email. Verification OTP resent. Please verify your email.",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          client_id: existingUser.client_id,
          createdAt: existingUser.createdAt
        }
      });
    } else {
      // 3. Check or create client
      const client =
        (await clientService.getClientByEmail(normalizedClientEmail)) ??
        (await clientService.createClient({
          name: client_name || normalizedEmail.split('@')[1]?.split('.')[0] || 'Default Client',
          email: normalizedClientEmail
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
        is_verified: false
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
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Internal server error"
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
        message: "OTP sent on registered Email.Please verify your email before logging in.",
      });
    }
    /* 5. Generate JWT */
    const payload = { id: user.id, role: user.role , client_id : user.client_id};
    const token = generateJWT(payload);

    /* 6. Set cookie */
    res.cookie("kandco_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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

    if (!full_name || full_name.trim() === '') {
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
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("kandco_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
    if (user.verification_otp !== otp || new Date() > user.verification_otp_expires) {
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