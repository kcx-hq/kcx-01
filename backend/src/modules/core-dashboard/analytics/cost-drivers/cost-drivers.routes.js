import express from 'express';
import {
  getCostDrivers,
  getCostDriversDecomposition,
  getCostDriversExecutiveSummary,
  getCostDriversKpis,
  getCostDriversRateVsUsage,
  getCostDriversTrust,
  getCostDriversWaterfall,
  getDriverDetails,
} from './cost-drivers.controller.js';

const router = express.Router();

router.get('/analysis', getCostDrivers);
router.get('/kpis', getCostDriversKpis);
router.get('/waterfall', getCostDriversWaterfall);
router.get('/decomposition', getCostDriversDecomposition);
router.get('/rate-vs-usage', getCostDriversRateVsUsage);
router.get('/trust', getCostDriversTrust);
router.get('/executive-summary', getCostDriversExecutiveSummary);

router.post('/details', getDriverDetails);

export default router;

