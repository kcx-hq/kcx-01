import express from 'express';
import {
  getQualityAnalysis,
  getQualityImpactBanner,
  getFreshnessStatus,
  getCoverageGates,
  getTagCompliance,
  getOwnershipCompleteness,
  getCurrencyBasisChecks,
  getDenominatorQuality,
  getControlViolations,
} from './data-quality.controller.js';

const router = express.Router();


// GET /api/quality/analysis?provider=AWS&service=EC2&region=us-east-1
router.get('/analysis', getQualityAnalysis);
router.get('/governance-data-health/banner', getQualityImpactBanner);
router.get('/governance-data-health/freshness', getFreshnessStatus);
router.get('/governance-data-health/coverage', getCoverageGates);
router.get('/governance-data-health/tag-compliance', getTagCompliance);
router.get('/governance-data-health/ownership-completeness', getOwnershipCompleteness);
router.get('/governance-data-health/currency-basis', getCurrencyBasisChecks);
router.get('/governance-data-health/denominator-quality', getDenominatorQuality);
router.get('/governance-data-health/control-violations', getControlViolations);

export default router;

