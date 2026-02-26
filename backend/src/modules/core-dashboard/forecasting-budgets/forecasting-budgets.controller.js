import { forecastingBudgetsService } from "./forecasting-budgets.service.js";

const normalizeUploadIds = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

export const getForecastingBudgetsSummary = async (req, res) => {
  try {
    const uploadIds = normalizeUploadIds(
      req.query.uploadIds ??
        req.body?.uploadIds ??
        req.query.uploadId ??
        req.body?.uploadId,
    );

    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const data = await forecastingBudgetsService.getSummary({
      filters,
      uploadIds,
      period: req.query.period || req.body?.period || "mtd",
      compareTo: req.query.compareTo || req.body?.compareTo || "previous_period",
      costBasis: req.query.costBasis || req.body?.costBasis || "actual",
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Forecasting & Budgets Summary Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to build Forecasting & Budgets summary",
      message: error.message,
    });
  }
};

