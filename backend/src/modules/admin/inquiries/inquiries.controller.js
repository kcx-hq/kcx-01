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

export const getInquiries = async (req, res) => {
  try {
    const result = await listInquiries(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInquiry = async (req, res) => {
  try {
    const inquiry = await getInquiryById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    return res.status(200).json(inquiry);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, meet_link } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const normalizedStatus = String(status).toUpperCase();
    const inquiry = await updateInquiryStatus(
      req.params.id,
      normalizedStatus,
      req.user?.admin_id,
      meet_link
    );
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

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

    return res.status(200).json({
      id: inquiry.id,
      status: inquiry.status,
      meet_link: inquiry.meet_link,
    });
  } catch (error) {
    if (error?.code === "INVALID_STATUS") {
      return res.status(400).json({ message: error.message });
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
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const bulkStatusUpdate = async (req, res) => {
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

    return res.status(200).json(result);
  } catch (error) {
    if (error?.code === "INVALID_STATUS") {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === "PENDING_LOCKED") {
      await logAdminEvent({
        adminId: req.user?.admin_id,
        eventType: "INQUIRY_PEND_LOCK_DENIED",
        entityType: "INQUIRY",
        description: "Pending inquiry locked from bulk admin status change.",
        metadata: { attempted_status: req.body?.status, ids: req.body?.ids || [] },
      });
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeInquiry = async (req, res) => {
  try {
    const inquiry = await deleteInquiry(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    await logAdminEvent({
      adminId: req.user?.admin_id,
      eventType: "INQUIRY_DELETE_PERMANENT",
      entityType: "INQUIRY",
      entityId: inquiry.id,
      description: `Admin permanently deleted inquiry ${inquiry.id}.`,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const bulkRemoveInquiries = async (req, res) => {
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
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const relayToBoss = async (req, res) => {
  try {
    const { severity, note } = req.body || {};
    const allowed = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!severity || !allowed.includes(String(severity).toUpperCase())) {
      return res.status(400).json({ message: "severity is required" });
    }

    const inquiry = await relayInquiryToBoss(
      req.params.id,
      req.user?.admin_id,
      { severity: String(severity).toUpperCase(), note: note ? String(note) : null },
      generateJWT({ inquiryId: req.params.id, type: "BOSS_REVIEW" }),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    );

    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

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

    return res.status(200).json({ message: "Relayed to boss" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
