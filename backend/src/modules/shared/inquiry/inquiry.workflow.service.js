import { Op } from "sequelize";
import sequelize from "../../../config/db.config.js";
import AppError from "../../../errors/AppError.js";
import { Inquiry } from "../../../models/index.js";
import { buildPendingInquiryKey } from "./lib/inquiryIdempotency.utils.js";
import { assertInquiryTransition } from "./lib/inquiryTransition.utils.js";
import { validateInquiryActionState } from "./inquiry.utils.js";

const SORT_FIELDS = new Set(["created_at", "preferred_datetime", "status", "email"]);

function assertRequired(value) {
  return !(value === null || value === undefined || String(value).trim() === "");
}

function normalizeOrder(value) {
  return String(value || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
}

function normalizeSort(value) {
  const normalized = String(value || "created_at").trim();
  return SORT_FIELDS.has(normalized) ? normalized : "created_at";
}

export async function createInquiryRecord(payload = {}) {
  if (
    !assertRequired(payload.name) ||
    !assertRequired(payload.email) ||
    !assertRequired(payload.message) ||
    !payload.preferred_datetime ||
    !assertRequired(payload.timezone)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  return Inquiry.create({
    name: String(payload.name).trim(),
    email: String(payload.email).trim().toLowerCase(),
    message: String(payload.message).trim(),
    preferred_datetime: payload.preferred_datetime,
    timezone: String(payload.timezone).trim(),
    status: payload.status || "PENDING",
    action_token: payload.action_token ?? null,
    meet_link: payload.meet_link ?? null,
  });
}

export async function createOrUpdatePendingInquiry(payload = {}) {
  if (
    !assertRequired(payload.name) ||
    !assertRequired(payload.email) ||
    !assertRequired(payload.message) ||
    !payload.preferred_datetime ||
    !assertRequired(payload.timezone)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  const tx = await sequelize.transaction();
  try {
    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const normalizedTimezone = String(payload.timezone).trim();
    const idempotencyKey = buildPendingInquiryKey({
      email: normalizedEmail,
      preferred_datetime: payload.preferred_datetime,
      timezone: normalizedTimezone,
    });
    const existing = await Inquiry.findOne({
      where: {
        email: normalizedEmail,
        preferred_datetime: payload.preferred_datetime,
        timezone: normalizedTimezone,
        status: "PENDING",
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (existing) {
      existing.name = String(payload.name).trim();
      existing.message = String(payload.message).trim();
      if (payload.action_token) {
        existing.action_token = payload.action_token;
      }
      await existing.save({ transaction: tx });
      await tx.commit();
      return { inquiry: existing, created: false, idempotencyKey };
    }

    const inquiry = await Inquiry.create(
      {
        name: String(payload.name).trim(),
        email: normalizedEmail,
        message: String(payload.message).trim(),
        preferred_datetime: payload.preferred_datetime,
        timezone: normalizedTimezone,
        status: "PENDING",
        action_token: payload.action_token ?? null,
      },
      { transaction: tx },
    );

    await tx.commit();
    return { inquiry, created: true, idempotencyKey };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function acceptInquiryByToken({ id, token, meetingLink = null }) {
  const tx = await sequelize.transaction();
  try {
    const inquiry = await Inquiry.findByPk(id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const stateError = validateInquiryActionState({ token, inquiry });
    if (stateError) {
      throw stateError;
    }
    assertInquiryTransition(inquiry.status, "ACCEPTED");

    await inquiry.update(
      {
        status: "ACCEPTED",
        meet_link: meetingLink,
        action_token: null,
      },
      { transaction: tx },
    );

    await tx.commit();
    return inquiry;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function rejectInquiryByToken({ id, token }) {
  const tx = await sequelize.transaction();
  try {
    const inquiry = await Inquiry.findByPk(id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const stateError = validateInquiryActionState({ token, inquiry });
    if (stateError) {
      throw stateError;
    }
    assertInquiryTransition(inquiry.status, "REJECTED");

    await inquiry.update(
      {
        status: "REJECTED",
        action_token: null,
      },
      { transaction: tx },
    );

    await tx.commit();
    return inquiry;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function listInquiries(options = {}) {
  const {
    status,
    email,
    limit = 20,
    offset = 0,
    sort = "created_at",
    order = "DESC",
  } = options;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (email) {
    where.email = {
      [Op.iLike]: `%${String(email).trim()}%`,
    };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeSort = normalizeSort(sort);
  const safeOrder = normalizeOrder(order);

  return Inquiry.findAll({
    where,
    limit: safeLimit,
    offset: safeOffset,
    order: [[safeSort, safeOrder]],
  });
}
