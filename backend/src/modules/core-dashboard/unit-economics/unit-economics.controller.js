import { unitEconomicsService } from "./unit-economics.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { normalizeUploadIds } from "../utils/uploadIds.utils.js";
import { assertUploadScope } from "../utils/uploadScope.service.js";

const readFilters = (query = {}) => ({
  provider: query.provider || "All",
  service: query.service || "All",
  region: query.region || "All",
  account: query.account || "All",
  subAccount: query.subAccount || "All",
  team: query.team || "All",
  env: query.env || "All",
  product: query.product || "All",
});

const buildSummaryOptions = async (req) => {
  const uploadIds = await assertUploadScope({
    uploadIds: normalizeUploadIds(
      req.query.uploadIds ?? req.body?.uploadIds ?? req.query?.uploadId ?? req.body?.uploadId,
    ),
    clientId: req.client_id,
  });

  if (!uploadIds.length) return null;

  return {
    filters: readFilters(req.query || {}),
    period: req.query.period || null,
    compareTo: req.query.compareTo || "previous_period",
    costBasis: req.query.costBasis || "actual",
    unitMetric: req.query.unitMetric || "consumed_quantity",
    uploadIds,
  };
};

const withSummary = (handler) => async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const options = await buildSummaryOptions(req);
    if (!options) return res.ok({});

    const payload = await unitEconomicsService.getSummary(options);
    return handler(payload, res);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Unit Economics Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getUnitEconomicsSummary = withSummary((payload, res) => res.ok(payload));

export const getAllocationKpis = withSummary((payload, res) =>
  res.ok({
    periodLabel: payload?.viewModel?.periodLabel || null,
    allocationOverview: payload?.viewModel?.allocationOverview || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getAllocationShowback = withSummary((payload, res) =>
  res.ok({
    periodLabel: payload?.viewModel?.periodLabel || null,
    showbackRows: payload?.viewModel?.showbackRows || [],
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getAllocationSharedPool = withSummary((payload, res) =>
  res.ok({
    sharedPool: payload?.viewModel?.sharedPool || null,
    sharedPoolTransparency: payload?.viewModel?.sharedPoolTransparency || [],
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getAllocationConfidence = withSummary((payload, res) =>
  res.ok({
    allocationConfidence: payload?.viewModel?.allocationOverview?.allocationConfidence || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getAllocationOwnershipDrift = withSummary((payload, res) =>
  res.ok({
    ownershipDrift: payload?.viewModel?.ownershipDrift || { series: [], flags: [] },
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getUnitKpis = withSummary((payload, res) =>
  res.ok({
    kpis: payload?.viewModel?.kpis || null,
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getUnitTrend = withSummary((payload, res) =>
  res.ok({
    trend: payload?.viewModel?.kpis?.trend || [],
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getUnitDecomposition = withSummary((payload, res) =>
  res.ok({
    decomposition: payload?.viewModel?.kpis?.decomposition || null,
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getUnitBenchmarks = withSummary((payload, res) =>
  res.ok({
    teamProductUnitRows: payload?.viewModel?.teamProductUnitRows || [],
    environmentUnitRows: payload?.viewModel?.environmentUnitRows || [],
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getUnitTargetGap = withSummary((payload, res) =>
  res.ok({
    target: payload?.viewModel?.kpis?.target || null,
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);

export const getDenominatorGate = withSummary((payload, res) =>
  res.ok({
    denominatorGate: payload?.viewModel?.denominatorGate || null,
    trust: payload?.viewModel?.trust || null,
  }),
);
