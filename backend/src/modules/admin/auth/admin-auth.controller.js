import bcrypt from "bcrypt";
import { generateJWT } from "../../../utils/jwt.js";
import { KcxAdmin } from "../../../models/index.js";
import jwt from "jsonwebtoken";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { logAdminEvent } from "../activity-logs/activity-logs.logger.js";

const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

export const signInAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = await KcxAdmin.findOne({ where: { email: normalizedEmail } });

    if (!admin) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    // const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    // if (!isPasswordValid) {
    //   return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    // }

    if (!admin.is_active) {
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
    }

    const payload = { admin_id: admin.id };
    const token = generateJWT(payload);

    res.cookie("kcx_admin_token", token, {
      ...ADMIN_COOKIE_OPTIONS,
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    await logAdminEvent({
      adminId: admin.id,
      eventType: "SIGN_IN",
      entityType: "AUTH",
      entityId: admin.id,
      description: `Admin signed in: ${admin.email}.`,
    });

    return res.ok({
      message: "Admin login successful",
      user: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Admin login failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
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
    ...ADMIN_COOKIE_OPTIONS,
  });

  return res.ok({ message: "Logged out successfully" });
};
