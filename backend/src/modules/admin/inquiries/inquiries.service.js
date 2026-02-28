import { Op } from "sequelize";
import { Inquiry } from "../../../models/index.js";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const listInquiries = async (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = String(query.status).toUpperCase();
  }
  if (query.exclude_status) {
    const raw = String(query.exclude_status);
    const parts = raw
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    if (parts.length === 1) {
      where.status = { [Op.ne]: parts[0] };
    } else if (parts.length > 1) {
      where.status = { [Op.notIn]: parts };
    }
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { message: { [Op.iLike]: term } },
    ];
  }

  const sortDirection = String(query.sort || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  const { rows, count } = await Inquiry.findAndCountAll({
    where,
    attributes: [
      "id",
      "name",
      "email",
      "message",
      "status",
      "meet_link",
      "preferred_datetime",
      "timezone",
      "activity_time",
      "updated_at",
      "trashed_at",
      "relay_severity",
      "relay_note",
      "relayed_at",
    ],
    order: [["activity_time", sortDirection]],
    limit,
    offset,
  });

  return {
    items: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const getInquiryById = async (id) => {
  return await Inquiry.findByPk(id, {
    attributes: [
      "id",
      "name",
      "email",
      "message",
      "status",
      "meet_link",
      "preferred_datetime",
      "timezone",
      "activity_time",
      "updated_at",
      "trashed_at",
      "relay_severity",
      "relay_note",
      "relayed_at",
    ],
  });
};

export const updateInquiryStatus = async (id, status, adminId, meetLink) => {
  const normalizedStatus = String(status || "").toUpperCase();
  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "STANDBY", "HANDLED", "TRASHED"];
  if (!validStatuses.includes(normalizedStatus)) {
    const err = new Error("Invalid status");
    err.code = "INVALID_STATUS";
    throw err;
  }

  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return null;
  if (inquiry.status === "PENDING" && normalizedStatus !== "PENDING") {
    const err = new Error("Pending inquiries can only be handled by boss.");
    err.code = "PENDING_LOCKED";
    throw err;
  }

  inquiry.status = normalizedStatus;
  if (typeof meetLink === "string") {
    inquiry.meet_link = meetLink.trim() || null;
  }
  if (normalizedStatus === "TRASHED") {
    inquiry.trashed_at = new Date();
  } else if (inquiry.trashed_at) {
    inquiry.trashed_at = null;
  }

  await inquiry.save();

  return inquiry;
};

export const bulkUpdateInquiryStatus = async (ids = [], status) => {
  const normalizedStatus = String(status || "").toUpperCase();
  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "STANDBY", "HANDLED", "TRASHED"];
  if (!validStatuses.includes(normalizedStatus)) {
    const err = new Error("Invalid status");
    err.code = "INVALID_STATUS";
    throw err;
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { updated: 0 };
  }

  const updates = { status: normalizedStatus };
  if (normalizedStatus === "TRASHED") {
    updates.trashed_at = new Date();
  } else {
    updates.trashed_at = null;
  }

  const where = { id: ids };
  if (normalizedStatus !== "PENDING") {
    where.status = { [Op.ne]: "PENDING" };
  }

  const [count] = await Inquiry.update(updates, { where });

  return { updated: count };
};

export const deleteInquiry = async (id) => {
  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return null;
  await inquiry.destroy();
  return inquiry;
};

export const bulkDeleteInquiries = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return { deleted: 0 };
  const count = await Inquiry.destroy({ where: { id: ids } });
  return { deleted: count };
};

export const relayInquiryToBoss = async (id, adminId, payload = {}, token, tokenExpiresAt) => {
  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return null;

  inquiry.relay_severity = payload.severity || null;
  inquiry.relay_note = payload.note || null;
  inquiry.boss_token = token;
  inquiry.boss_token_expires = tokenExpiresAt;
  inquiry.relayed_at = new Date();
  await inquiry.save();

  return inquiry;
};
