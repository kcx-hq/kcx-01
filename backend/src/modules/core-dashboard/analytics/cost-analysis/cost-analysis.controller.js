import { Op, Sequelize } from "sequelize";
import logger from "../../../../lib/logger.js";
import {
  BillingUsageFact,
  Resource,
  Service,
  Region,
  CloudAccount,
} from "../../../../models/index.js";
import AppError from "../../../../errors/AppError.js";
import { extractUploadIdsBodyFirst } from "../../utils/uploadIds.utils.js";

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

export const getCostAnalysis = async (req, res, next) => {
  try {
    const uploadIds = await assertUploadScope({
      uploadIds: extractUploadIdsBodyFirst(req),
      clientId: req.client_id,
    });

    if (!uploadIds.length) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const source =
      Object.keys(req.body || {}).length > 0 ? req.body : req.query;

    const filters = {
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
      startDate: source.startDate || null,
      endDate: source.endDate || null,
      groupBy: source.groupBy || "ServiceName",
    };

    let groupBy = filters.groupBy || "ServiceName";
    if (!ALLOWED_GROUPS.includes(groupBy)) {
      groupBy = "ServiceName";
    }

    const data = await generateCostAnalysis(
      {
        ...filters,
        uploadIds
      },
      groupBy
    );

    return res.ok(data);

  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Cost analysis error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};




export const getFilterOptions = async (req, res, next) => {
  try {
    const uploadIds = await assertUploadScope({
      uploadIds: extractUploadIdsBodyFirst(req),
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
