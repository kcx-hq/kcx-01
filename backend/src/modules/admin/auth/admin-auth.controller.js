import bcrypt from "bcrypt";
import { generateJWT } from "../../../utils/jwt.js";
import { KcxAdmin } from "../../../models/index.js";
import jwt from "jsonwebtoken";
import { logAdminEvent } from "../activity-logs/activity-logs.logger.js";

export const signInAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = await KcxAdmin.findOne({ where: { email: normalizedEmail } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!admin.is_active) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const payload = { admin_id: admin.id };
    const token = generateJWT(payload);

    res.cookie("kcx_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    await logAdminEvent({
      adminId: admin.id,
      eventType: "SIGN_IN",
      entityType: "AUTH",
      entityId: admin.id,
      description: `Admin signed in: ${admin.email}.`,
    });

    return res.status(200).json({
      message: "Admin login successful",
      user: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutAdmin = (req, res) => {
  try {
    const token =
      req.cookies.kcx_admin_token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.admin_id) {
        logAdminEvent({
          adminId: decoded.admin_id,
          eventType: "SIGN_OUT",
          entityType: "AUTH",
          entityId: decoded.admin_id,
          description: "Admin signed out.",
        });
      }
    }
  } catch (error) {
    // ignore logout logging failures
  }

  res.clearCookie("kcx_admin_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};
