import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";
import { costDriversService } from './cost-drivers.service.js';

function normalizeUploadIds(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(String).map((value) => value.trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadid ??
      req.query.uploadId ??
      req.query.uploadids ??
      req.query.uploadIds ??
      req.body?.uploadid ??
      req.body?.uploadId ??
      req.body?.uploadIds,
  );
}

const parseNumberOrDefault = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const readFilters = (source = {}) => ({
  provider: source.provider || 'All',
  service: source.service || 'All',
  region: source.region || 'All',
  account: source.account || 'All',
  subAccount: source.subAccount || 'All',
  team: source.team || 'All',
  app: source.app || 'All',
  env: source.env || 'All',
  costCategory: source.costCategory || 'All',
  tagKey: source.tagKey || '',
  tagValue: source.tagValue || '',
  uploadId: source.uploadId || source.uploadid || null,
});

export const getCostDrivers = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const uploadIds = extractUploadIds(req);
    const query = req.query || {};

    const filters = readFilters(query);
    const period = parseNumberOrDefault(query.period, 30);
    const minChange = parseNumberOrDefault(query.minChange, 0);
    const rowLimit = parseNumberOrDefault(query.rowLimit, 100);

    const data = await costDriversService.getCostDrivers({
      filters,
      period,
      timeRange: query.timeRange || null,
      compareTo: query.compareTo || null,
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      previousStartDate: query.previousStartDate || null,
      previousEndDate: query.previousEndDate || null,
      costBasis: query.costBasis || null,
      dimension: query.dimension || 'service',
      minChange,
      rowLimit,
      activeServiceFilter: query.activeServiceFilter || 'All',
      uploadIds,
    });

    const safeData = data || {};
    if (
      Array.isArray(safeData.increases) &&
      Array.isArray(safeData.decreases) &&
      safeData.increases.length === 0 &&
      safeData.decreases.length === 0 &&
      !safeData.message
    ) {
      safeData.message =
        'No cost changes detected in selected windows. Try another time range or compare mode.';
    }

    return res.ok(safeData);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getCostDrivers");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getDriverDetails = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const uploadIds = extractUploadIds(req);
    if (!uploadIds.length) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const body = req.body || {};
    const query = req.query || {};
    const merged = { ...query, ...body };
    const filters = readFilters(merged.filters || merged);

    const driver = body.driver || null;
    const driverKey = body.driverKey || body.key || body.name || null;
    const dimension =
      body.dimension ||
      body?.driver?.dimension ||
      body?.driver?.detailsPayload?.dimension ||
      query.dimension ||
      'service';

    if (!driver && !driverKey) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const period = parseNumberOrDefault(body.period ?? query.period, 30);
    const data = await costDriversService.getDriverDetails({
      driver,
      driverKey,
      dimension,
      period,
      timeRange: body.timeRange ?? query.timeRange ?? null,
      compareTo: body.compareTo ?? query.compareTo ?? null,
      startDate: body.startDate ?? query.startDate ?? null,
      endDate: body.endDate ?? query.endDate ?? null,
      previousStartDate: body.previousStartDate ?? query.previousStartDate ?? null,
      previousEndDate: body.previousEndDate ?? query.previousEndDate ?? null,
      costBasis: body.costBasis ?? query.costBasis ?? null,
      filters,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getDriverDetails");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
