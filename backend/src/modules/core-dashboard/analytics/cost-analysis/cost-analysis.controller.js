import { Op, Sequelize } from "sequelize";
import {
  BillingUsageFact,
  Resource,
  Service,
  Region,
  CloudAccount,
} from "../../../../models/index.js";

import {
  generateCostAnalysis,
  getFilterDropdowns,
} from "./cost-analysis.service.js";

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

/**
 * Normalize uploadIds from body or query
 */
function extractUploadIds(req) {
  const bodyValue = req.body?.uploadIds || req.body?.uploadId;
  const queryValue = req.query?.uploadIds || req.query?.uploadId;

  const source = bodyValue ?? queryValue;
  if (!source) return [];

  if (Array.isArray(source)) return source;

  if (typeof source === "string") {
    return source
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [source];
}


export const getCostAnalysis = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);

    if (!uploadIds.length) {
      return res.status(400).json({ error: "uploadIds is required" });
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

    res.json(data);

  } catch (error) {
    console.error("Cost Analysis Error:", error);
    res.status(500).json({
      error: "Failed to generate cost analysis",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};




export const getFilterOptions = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const options = await getFilterDropdowns(uploadIds);
    res.json(options);
  } catch (error) {
    console.error("Filter Error:", error);
    res.status(500).json({ error: "Failed to load filters" });
  }
};
