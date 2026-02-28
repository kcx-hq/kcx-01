import {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  notifyUnverifiedUser,
  deleteUser,
} from "./users.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const getUsers = async (req, res, next) => {
  try {
    const result = await listUsers(req.query);
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getUsers failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));
    return res.ok(user);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getUser failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const user = await updateUserStatus(req.params.id, is_active, req.user?.admin_id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));

    return res.ok({
      id: user.id,
      is_active: user.is_active,
    });
  } catch (error) {
    if (error?.code === "LAST_ADMIN") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.message?.includes("own account")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "updateStatus failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const user = await updateUserRole(req.params.id, role, req.user?.admin_id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));

    return res.ok({
      id: user.id,
      role: user.role,
    });
  } catch (error) {
    if (error?.code === "INVALID_ROLE" || error?.code === "LAST_ADMIN") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.message?.includes("own account")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "updateRole failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const notifyUnverified = async (req, res, next) => {
  try {
    const user = await notifyUnverifiedUser(req.params.id, req.user?.admin_id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));
    return res.ok({ message: "Verification email sent." });
  } catch (error) {
    if (error?.code === "ALREADY_VERIFIED") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.message?.includes("own account")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "notifyUnverified failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    const user = await deleteUser(req.params.id, req.user?.admin_id, password);
    if (!user) return next(new AppError(404, "NOT_FOUND", "Not found"));
    return res.ok({ message: "User deleted" });
  } catch (error) {
    if (error?.message?.includes("own account")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.code === "INVALID_PASSWORD") {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "removeUser failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
