import { Op } from "sequelize";
import {
  User,
  Inquiry,
  BillingUpload,
  ClientS3Integrations,
  LoginAttempt,
} from "../../../models/index.js";
import logger from "../../../lib/logger.js";

const DEFAULT_RECENT_DAYS = 7;
const DEFAULT_ACTIVITY_LIMIT = 5;
const CACHE_TTL_MS = 15000;
const STUCK_UPLOAD_MINUTES = 30;

const overviewCache = new Map();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const safeCount = async (model, options = {}, fallback = 0) => {
  try {
    return await model.count(options);
  } catch (error) {
    logger.warn({ err: error, model: model?.name }, "Overview count failed");
    return fallback;
  }
};

const safeFindAll = async (model, options = {}, fallback = []) => {
  try {
    return await model.findAll(options);
  } catch (error) {
    logger.warn({ err: error, model: model?.name }, "Overview findAll failed");
    return fallback;
  }
};

export const getOverviewSnapshot = async (params = {}) => {
  const recentDays = toInt(params.recentDays, DEFAULT_RECENT_DAYS);
  const activityLimit = toInt(params.activityLimit, DEFAULT_ACTIVITY_LIMIT);
  const force = params.force === true;
  const cacheKey = `${recentDays}:${activityLimit}`;

  if (!force) {
    const cached = overviewCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.payload, meta: { ...cached.payload.meta, cached: true } };
    }
  }
  const recentSince = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    recentUsers,
    totalInquiries,
    pendingInquiries,
    recentInquiries,
    totalUploads,
    uploadStatusCounts,
    totalConnections,
    enabledConnections,
    errorConnections,
  ] = await Promise.all([
    safeCount(User),
    safeCount(User, { where: { is_active: true } }),
    safeCount(User, { where: { createdAt: { [Op.gte]: recentSince } } }),
    safeCount(Inquiry),
    safeCount(Inquiry, { where: { status: "PENDING" } }),
    safeCount(Inquiry, { where: { activity_time: { [Op.gte]: recentSince } } }),
    safeCount(BillingUpload),
    safeFindAll(BillingUpload, {
      attributes: ["status", [BillingUpload.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true,
    }),
    safeCount(ClientS3Integrations),
    safeCount(ClientS3Integrations, { where: { enabled: true } }),
    safeCount(ClientS3Integrations, { where: { lasterror: { [Op.not]: null } } }),
  ]);

  const uploadStatusSummary = uploadStatusCounts.reduce((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});
  const uploadStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
  uploadStatuses.forEach((status) => {
    if (uploadStatusSummary[status] === undefined) {
      uploadStatusSummary[status] = 0;
    }
  });
  const uploadsByStatusTotal = uploadStatuses.reduce(
    (sum, status) => sum + uploadStatusSummary[status],
    0
  );
  const uploadStatusMismatch = uploadsByStatusTotal !== totalUploads;

  const [recentUserRows, recentInquiryRows, recentUploadRows, recentConnRows] =
    await Promise.all([
      safeFindAll(User, {
        attributes: ["id", "email", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      safeFindAll(Inquiry, {
        attributes: ["id", "email", "activity_time", "status"],
        order: [["activity_time", "DESC"]],
        limit: 5,
      }),
      safeFindAll(BillingUpload, {
        attributes: ["uploadid", "status", "uploadedat"],
        order: [["uploadedat", "DESC"]],
        limit: 5,
      }),
      safeFindAll(ClientS3Integrations, {
        attributes: ["id", "enabled", "lasterror", "updatedat", "createdat"],
        order: [["updatedat", "DESC"]],
        limit: 5,
      }),
    ]);

  const activityFeed = [
    ...recentUserRows.map((row) => ({
      type: "USER_CREATED",
      entityId: row.id,
      timestamp: row.createdAt,
      label: row.email,
    })),
    ...recentInquiryRows.map((row) => ({
      type: "INQUIRY_CREATED",
      entityId: row.id,
      timestamp: row.activity_time || row.createdAt,
      label: row.email,
      status: row.status,
    })),
    ...recentUploadRows.map((row) => ({
      type: "UPLOAD_STATUS",
      entityId: row.uploadid,
      timestamp: row.uploadedat,
      status: row.status,
    })),
    ...recentConnRows.map((row) => ({
      type: "AWS_CONNECTION",
      entityId: row.id,
      timestamp: row.updatedat || row.createdat,
      status: row.lasterror ? "ERROR" : row.enabled ? "ENABLED" : "DISABLED",
    })),
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, activityLimit);

  const stuckSince = new Date(Date.now() - STUCK_UPLOAD_MINUTES * 60 * 1000);
  const [stuckUploadsCount, failedUploadsCount, oldInquiriesCount, blockedLoginRows] =
    await Promise.all([
      safeCount(BillingUpload, {
        where: {
          status: "PROCESSING",
          uploadedat: { [Op.lte]: stuckSince },
        },
      }),
      safeCount(BillingUpload, { where: { status: "FAILED" } }),
      safeCount(Inquiry, {
        where: {
          status: "PENDING",
          activity_time: { [Op.lte]: stuckSince },
        },
      }),
      safeFindAll(LoginAttempt, {
        where: { blocked_until: { [Op.gt]: new Date() } },
        attributes: ["email"],
        order: [["blocked_until", "DESC"]],
        limit: 5,
      }),
    ]);

  const attention = [];
  if (failedUploadsCount > 0) {
    attention.push({
      type: "UPLOAD_FAILURES",
      message: `${failedUploadsCount} upload failure(s) detected`,
      severity: "critical",
    });
  }
  if (stuckUploadsCount > 0) {
    attention.push({
      type: "UPLOADS_STUCK",
      message: `${stuckUploadsCount} upload(s) stuck in processing`,
      severity: "warning",
    });
  }
  if (oldInquiriesCount > 0) {
    attention.push({
      type: "INQUIRIES_PENDING",
      message: `${oldInquiriesCount} inquiry(s) pending > ${STUCK_UPLOAD_MINUTES} min`,
      severity: "warning",
    });
  }
  if (blockedLoginRows.length > 0) {
    blockedLoginRows.forEach((row) => {
      attention.push({
        type: "LOGIN_ATTEMPT_BLOCKED",
        message: `Login blocked: ${row.email}`,
        severity: "warning",
      });
    });
  }

  const systemStatus = attention.find((item) => item.severity === "critical")
    ? {
        level: "critical",
        message: "Critical: upload failures detected",
      }
    : attention.length > 0
    ? {
        level: "degraded",
        message: "Degraded: attention required",
      }
    : {
        level: "operational",
        message: "All systems operational",
      };

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      recent: recentUsers,
    },
    inquiries: {
      total: totalInquiries,
      pending: pendingInquiries,
      recent: recentInquiries,
    },
    uploads: {
      total: totalUploads,
      byStatus: uploadStatusSummary,
      byStatusTotal: uploadsByStatusTotal,
      statusMismatch: uploadStatusMismatch,
    },
    awsConnections: {
      total: totalConnections,
      enabled: enabledConnections,
      withErrors: errorConnections,
    },
    activity: activityFeed,
    attention,
    systemStatus,
    meta: {
      recentDays,
      activityLimit,
      generatedAt: new Date().toISOString(),
      lastRefreshedAt: new Date().toISOString(),
      scopeLabel: recentDays >= 365 ? "All time" : `Last ${recentDays} days`,
      environment: process.env.NODE_ENV || "development",
      warnings: uploadStatusMismatch
        ? ["Upload status counts do not match total uploads"]
        : [],
      cached: false,
    },
  };
};

export const getCachedOverviewSnapshot = async (params = {}) => {
  const payload = await getOverviewSnapshot(params);
  const recentDays = toInt(params.recentDays, DEFAULT_RECENT_DAYS);
  const activityLimit = toInt(params.activityLimit, DEFAULT_ACTIVITY_LIMIT);
  const cacheKey = `${recentDays}:${activityLimit}`;

  overviewCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return payload;
};
