
/**
 * Quality Controller
 * HTTP request handlers for Data Quality & Governance
 */

import { dataQualityService } from './data-quality.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";
import { assertUploadScope } from "../../utils/uploadScope.service.js";

/**
 * Helper: Normalize uploadId(s) from query/body into an array
 * Supports:
 * - uploadId: "uuid"
 * - uploadId: ["uuid1","uuid2"]
 * - uploadIds: "uuid1,uuid2"
 * - uploadIds: ["uuid1","uuid2"]
 */
function normalizeUploadIds(req) {
  const fromQuery = req.query?.uploadId ?? req.query?.uploadIds;
  const fromBody = req.body?.uploadId ?? req.body?.uploadIds;
  const raw = fromQuery ?? fromBody;

  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean);
  }

  // allow comma-separated strings
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * GET /api/quality/analysis
 * Get data quality analysis with fully computed, UI-ready data
 */
export const getQualityAnalysis = async (req, res, next) => {
  try {
    const { filters, startDate, endDate, uploadIds } = await extractCommonQualityParams(req);

    const data = await dataQualityService.analyzeDataQuality({
      filters,
      startDate,
      endDate,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'Error in getQualityAnalysis');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

async function extractCommonQualityParams(req) {
  const filters = {
    provider: req.query.provider || req.body?.provider || 'All',
    service: req.query.service || req.body?.service || 'All',
    region: req.query.region || req.body?.region || 'All',
  };

  const startDate = req.query.startDate || req.body?.startDate || null;
  const endDate = req.query.endDate || req.body?.endDate || null;
  const uploadIds = await assertUploadScope({
    uploadIds: normalizeUploadIds(req),
    clientId: req.client_id,
  });

  return { filters, startDate, endDate, uploadIds };
}

async function withQualityCall(req, res, next, fnName) {
  try {
    const params = await extractCommonQualityParams(req);
    const data = await dataQualityService[fnName](params);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    logger.error({ err: error, requestId: req.requestId }, `Error in ${fnName}`);
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
}

export const getQualityImpactBanner = async (req, res, next) =>
  withQualityCall(req, res, next, 'getQualityImpactBanner');

export const getFreshnessStatus = async (req, res, next) =>
  withQualityCall(req, res, next, 'getFreshnessStatus');

export const getCoverageGates = async (req, res, next) =>
  withQualityCall(req, res, next, 'getCoverageGates');

export const getTagCompliance = async (req, res, next) =>
  withQualityCall(req, res, next, 'getTagCompliance');

export const getOwnershipCompleteness = async (req, res, next) =>
  withQualityCall(req, res, next, 'getOwnershipCompleteness');

export const getCurrencyBasisChecks = async (req, res, next) =>
  withQualityCall(req, res, next, 'getCurrencyBasisChecks');

export const getDenominatorQuality = async (req, res, next) =>
  withQualityCall(req, res, next, 'getDenominatorQuality');

export const getControlViolations = async (req, res, next) =>
  withQualityCall(req, res, next, 'getControlViolations');
