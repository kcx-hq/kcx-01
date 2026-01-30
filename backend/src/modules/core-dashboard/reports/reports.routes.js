/**
 * Reports Routes
 * RESTful routes for FinOps reports
 */

import express from 'express';
import {
  getSummary,
  getTopServices,
  getTopRegions,
  getMonthlySpend,
  getTagCompliance,
  getEnvironmentBreakdown,
  downloadPDF
} from './reports.controller.js';

const router = express.Router();



// GET /api/reports/summary - Comprehensive dashboard summary
router.get('/summary', getSummary);

// GET /api/reports/top-services - Top services by spend
router.get('/top-services', getTopServices);

// GET /api/reports/top-regions - Top regions by spend
router.get('/top-regions', getTopRegions);

// GET /api/reports/monthly-spend - Monthly spend trend
router.get('/monthly-spend', getMonthlySpend);

// GET /api/reports/tag-compliance - Tag compliance metrics
router.get('/tag-compliance', getTagCompliance);

// GET /api/reports/environment-breakdown - Prod vs non-prod breakdown
router.get('/environment-breakdown', getEnvironmentBreakdown);

// POST /api/reports/download - Generate and download PDF report
router.post('/download', downloadPDF);

export default router;

