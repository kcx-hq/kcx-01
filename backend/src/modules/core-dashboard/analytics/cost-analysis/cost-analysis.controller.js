import logger from "../../../../lib/logger.js";
import AppError from "../../../../errors/AppError.js";
import { extractUploadIdsFromRequest } from "../../utils/uploadIds.utils.js";

import {
  generateCostAnalysis,
  getFilterDropdowns,
} from "./cost-analysis.service.js";
import { assertUploadScope } from "../../utils/uploadScope.service.js";

// Whitelist allowed grouping columns for security
const ALLOWED_GROUPS = [
  "ServiceName",
  "RegionName",
  "ProviderName",
  "Account",
  "Team",
  "App",
  "Env",
  "CostCategory",
];

const getInputSource = (req) => req.query || {};

const parseFilters = (source = {}) => ({
  provider: source.provider || "All",
  service: source.service || "All",
  region: source.region || "All",
  account: source.account || "All",
  subAccount: source.subAccount || "All",
  app: source.app || "All",
  team: source.team || "All",
  env: source.env || "All",
  costCategory: source.costCategory || "All",
  tagKey: source.tagKey || "",
  tagValue: source.tagValue || "",
  timeRange: source.timeRange || "30d",
  granularity: source.granularity || "daily",
  compareTo: source.compareTo || "previous_period",
  costBasis: source.costBasis || "actual",
  currencyMode: source.currencyMode || "usd",
  startDate: source.startDate || null,
  endDate: source.endDate || null,
  groupBy: source.groupBy || "ServiceName",
});

const resolveScopedRequest = async (req) => {
  const uploadIds = await assertUploadScope({
    uploadIds: extractUploadIdsFromRequest(req),
    clientId: req.client_id,
  });
  if (!uploadIds.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  const filters = parseFilters(getInputSource(req));
  const groupBy = ALLOWED_GROUPS.includes(filters.groupBy) ? filters.groupBy : "ServiceName";
  const data = await generateCostAnalysis(
    {
      ...filters,
      uploadIds,
    },
    groupBy
  );

  return { data };
};

const withCostAnalysis = (handler) => async (req, res, next) => {
  try {
    const { data } = await resolveScopedRequest(req);
    return handler({ data, res });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Cost analysis error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getCostAnalysis = withCostAnalysis(({ data, res }) => res.ok(data));

export const getCostAnalysisKpis = withCostAnalysis(({ data, res }) =>
  res.ok({
    controls: data?.spendAnalytics?.controls || null,
    trust: data?.spendAnalytics?.trust || null,
    kpiDeck: data?.spendAnalytics?.kpiDeck || null,
  })
);

export const getCostAnalysisTrend = withCostAnalysis(({ data, res }) =>
  res.ok({
    controls: data?.spendAnalytics?.controls || null,
    trust: data?.spendAnalytics?.trust || null,
    trend: data?.spendAnalytics?.trend || null,
  })
);

export const getCostAnalysisBreakdown = withCostAnalysis(({ data, res }) =>
  res.ok({
    controls: data?.spendAnalytics?.controls || null,
    trust: data?.spendAnalytics?.trust || null,
    breakdown: data?.spendAnalytics?.breakdown || null,
  })
);

export const getCostAnalysisConcentration = withCostAnalysis(({ data, res }) =>
  res.ok({
    controls: data?.spendAnalytics?.controls || null,
    trust: data?.spendAnalytics?.trust || null,
    concentration: data?.spendAnalytics?.concentration || null,
    concentrationPareto: data?.spendAnalytics?.concentrationPareto || null,
  })
);

export const getCostAnalysisAnomalyImpact = withCostAnalysis(({ data, res }) =>
  res.ok({
    controls: data?.spendAnalytics?.controls || null,
    trust: data?.spendAnalytics?.trust || null,
    anomalyImpact: data?.spendAnalytics?.anomalyImpact || null,
    anomalyDetection: data?.spendAnalytics?.anomalyDetection || null,
  })
);




export const getFilterOptions = async (req, res, next) => {
  try {
    const uploadIds = await assertUploadScope({
      uploadIds: extractUploadIdsFromRequest(req),
      clientId: req.client_id,
    });
    const options = await getFilterDropdowns(uploadIds);
    return res.ok(options);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Filter options error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
