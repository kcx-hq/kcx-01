import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";
import { costDriversService } from "./cost-drivers.service.js";
import { assertUploadScope } from "../../utils/uploadScope.service.js";
import { extractUploadIdsFromRequest } from "../../utils/uploadIds.utils.js";

const parseNumberOrDefault = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const readFilters = (source = {}) => ({
  provider: source.provider || "All",
  service: source.service || "All",
  region: source.region || "All",
  account: source.account || "All",
  subAccount: source.subAccount || "All",
  team: source.team || "All",
  app: source.app || "All",
  env: source.env || "All",
  costCategory: source.costCategory || "All",
  tagKey: source.tagKey || "",
  tagValue: source.tagValue || "",
  uploadId: source.uploadId || source.uploadid || null,
});

const resolveScopedUploadIds = async (req) => {
  const uploadIds = await assertUploadScope({
    uploadIds: extractUploadIdsFromRequest(req),
    clientId: req.client_id,
  });
  if (!uploadIds.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }
  return uploadIds;
};

const buildAnalysisOptions = async (req) => {
  const uploadIds = await resolveScopedUploadIds(req);
  const query = req.query || {};
  const filters = readFilters(query);

  return {
    filters,
    period: parseNumberOrDefault(query.period, 30),
    timeRange: query.timeRange || null,
    compareTo: query.compareTo || null,
    startDate: query.startDate || null,
    endDate: query.endDate || null,
    previousStartDate: query.previousStartDate || null,
    previousEndDate: query.previousEndDate || null,
    costBasis: query.costBasis || null,
    dimension: query.dimension || "service",
    minChange: parseNumberOrDefault(query.minChange, 0),
    rowLimit: parseNumberOrDefault(query.rowLimit, 100),
    activeServiceFilter: query.activeServiceFilter || "All",
    uploadIds,
  };
};

const withAnalysis = (handler) => async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const options = await buildAnalysisOptions(req);
    const payload = await costDriversService.getCostDrivers(options);
    return handler(payload, res);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Error in cost drivers controller");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getCostDrivers = withAnalysis((payload, res) => res.ok(payload));

export const getCostDriversKpis = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    periodWindows: payload?.periodWindows || null,
    varianceSummary: payload?.varianceSummary || null,
    kpiStrip: payload?.kpiStrip || [],
    trust: payload?.trust || null,
    attributionConfidence: payload?.attributionConfidence || null,
  }),
);

export const getCostDriversWaterfall = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    varianceSummary: payload?.varianceSummary || null,
    waterfall: payload?.waterfall || null,
    topDrivers: payload?.topDrivers || [],
  }),
);

export const getCostDriversDecomposition = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    decomposition: payload?.decomposition || null,
    topDrivers: payload?.topDrivers || [],
  }),
);

export const getCostDriversRateVsUsage = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    rateVsUsage: payload?.rateVsUsage || null,
    trust: payload?.trust || null,
  }),
);

export const getCostDriversTrust = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    trust: payload?.trust || null,
    unexplainedVariance: payload?.unexplainedVariance || null,
    attributionConfidence: payload?.attributionConfidence || null,
    runMeta: payload?.runMeta || null,
  }),
);

export const getCostDriversExecutiveSummary = withAnalysis((payload, res) =>
  res.ok({
    controls: payload?.controls || null,
    executiveInsights: payload?.executiveInsights || { bullets: [] },
    topDrivers: payload?.topDrivers || [],
    trust: payload?.trust || null,
  }),
);

export const getDriverDetails = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const uploadIds = await resolveScopedUploadIds(req);

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
      "service";

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
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Error in getDriverDetails");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
