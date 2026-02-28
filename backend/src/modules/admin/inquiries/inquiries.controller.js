import {
  listInquiries,
  getInquiryById,
  updateInquiryStatus,
  relayInquiryToBoss,
  bulkUpdateInquiryStatus,
  deleteInquiry,
  bulkDeleteInquiries,
} from "./inquiries.service.js";
import { generateJWT } from "../../../utils/jwt.js";
import { sendInquiryRelayEmailToBoss } from "../../../utils/sendEmail.js";
import { logAdminEvent } from "../activity-logs/activity-logs.logger.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const getInquiries = async (req, res, next) => {
  try {
    const result = await listInquiries(req.query);
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getInquiries failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getInquiry = async (req, res, next) => {
  try {
    const inquiry = await getInquiryById(req.params.id);
    if (!inquiry) return next(new AppError(404, "NOT_FOUND", "Not found"));
    return res.ok(inquiry);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getInquiry failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, meet_link } = req.body || {};
    if (!status) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const normalizedStatus = String(status).toUpperCase();
    const inquiry = await updateInquiryStatus(
      req.params.id,
      normalizedStatus,
      req.user?.admin_id,
      meet_link
    );
    if (!inquiry) return next(new AppError(404, "NOT_FOUND", "Not found"));

    if (["HANDLED", "TRASHED", "PENDING"].includes(normalizedStatus)) {
      const eventType =
        normalizedStatus === "HANDLED"
          ? "INQUIRY_MARK_HANDLED"
          : normalizedStatus === "TRASHED"
          ? "INQUIRY_MOVE_TO_TRASH"
          : "INQUIRY_RESTORE_TO_ACTIVE";
      await logAdminEvent({
        adminId: req.user?.admin_id,
        eventType,
        entityType: "INQUIRY",
        entityId: inquiry.id,
        description: `Admin updated inquiry ${inquiry.id} to ${normalizedStatus}.`,
        metadata: { status: normalizedStatus },
      });
    }

    return res.ok({
      id: inquiry.id,
      status: inquiry.status,
      meet_link: inquiry.meet_link,
    });
  } catch (error) {
    if (error?.code === "INVALID_STATUS") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.code === "PENDING_LOCKED") {
      await logAdminEvent({
        adminId: req.user?.admin_id,
        eventType: "INQUIRY_PEND_LOCK_DENIED",
        entityType: "INQUIRY",
        entityId: req.params.id,
        description: "Pending inquiry locked from admin status change.",
        metadata: { attempted_status: req.body?.status },
      });
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "updateStatus failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const bulkStatusUpdate = async (req, res, next) => {
  try {
    const { ids, status } = req.body || {};
    const normalizedStatus = String(status || "").toUpperCase();
    const result = await bulkUpdateInquiryStatus(ids, status);

    if (["HANDLED", "TRASHED", "PENDING"].includes(normalizedStatus)) {
      const eventType =
        normalizedStatus === "HANDLED"
          ? "INQUIRY_BULK_MARK_HANDLED"
          : normalizedStatus === "TRASHED"
          ? "INQUIRY_BULK_MOVE_TO_TRASH"
          : "INQUIRY_BULK_RESTORE_TO_ACTIVE";
      await logAdminEvent({
        adminId: req.user?.admin_id,
        eventType,
        entityType: "INQUIRY",
        description: `Admin bulk updated ${result?.updated || 0} inquiries to ${normalizedStatus}.`,
        metadata: { status: normalizedStatus, ids: Array.isArray(ids) ? ids : [] },
      });
    }

    return res.ok(result);
  } catch (error) {
    if (error?.code === "INVALID_STATUS") {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
    }
    if (error?.code === "PENDING_LOCKED") {
      await logAdminEvent({
        adminId: req.user?.admin_id,
        eventType: "INQUIRY_PEND_LOCK_DENIED",
        entityType: "INQUIRY",
        description: "Pending inquiry locked from bulk admin status change.",
        metadata: { attempted_status: req.body?.status, ids: req.body?.ids || [] },
      });
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action", { cause: error }));
    }
    logger.error({ err: error, requestId: req.requestId }, "bulkStatusUpdate failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const removeInquiry = async (req, res, next) => {
  try {
    const inquiry = await deleteInquiry(req.params.id);
    if (!inquiry) return next(new AppError(404, "NOT_FOUND", "Not found"));
    await logAdminEvent({
      adminId: req.user?.admin_id,
      eventType: "INQUIRY_DELETE_PERMANENT",
      entityType: "INQUIRY",
      entityId: inquiry.id,
      description: `Admin permanently deleted inquiry ${inquiry.id}.`,
    });
    return res.ok({ ok: true });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "removeInquiry failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const bulkRemoveInquiries = async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    const result = await bulkDeleteInquiries(ids);
    await logAdminEvent({
      adminId: req.user?.admin_id,
      eventType: "INQUIRY_BULK_DELETE_PERMANENT",
      entityType: "INQUIRY",
      description: `Admin permanently deleted ${result?.deleted || 0} inquiries.`,
      metadata: { ids: Array.isArray(ids) ? ids : [] },
    });
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "bulkRemoveInquiries failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const relayToBoss = async (req, res, next) => {
  try {
    const { severity, note } = req.body || {};
    const allowed = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!severity || !allowed.includes(String(severity).toUpperCase())) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const inquiry = await relayInquiryToBoss(
      req.params.id,
      req.user?.admin_id,
      { severity: String(severity).toUpperCase(), note: note ? String(note) : null },
      generateJWT({ inquiryId: req.params.id, type: "BOSS_REVIEW" }),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    );

    if (!inquiry) return next(new AppError(404, "NOT_FOUND", "Not found"));

    const reviewLink = `${process.env.BACKEND_URL}/api/inquiry/review/${inquiry.id}?token=${inquiry.boss_token}`;

    await sendInquiryRelayEmailToBoss({
      name: inquiry.name,
      email: inquiry.email,
      message: inquiry.message,
      preferred_datetime: inquiry.preferred_datetime,
      timezone: inquiry.timezone,
      severity: inquiry.relay_severity,
      note: inquiry.relay_note,
      reviewLink,
    });

    return res.ok({ message: "Relayed to boss" });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "relayToBoss failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
