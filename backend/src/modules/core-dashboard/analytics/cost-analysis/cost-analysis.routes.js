import express from 'express';
import {
  getCostAnalysis,
  getCostAnalysisAnomalyImpact,
  getCostAnalysisBreakdown,
  getCostAnalysisConcentration,
  getCostAnalysisKpis,
  getCostAnalysisTrend,
  getFilterOptions,
} from './cost-analysis.controller.js';

const router = express.Router();

router.get('/analysis', getCostAnalysis);
router.get('/kpis', getCostAnalysisKpis);
router.get('/trend', getCostAnalysisTrend);
router.get('/breakdown', getCostAnalysisBreakdown);
router.get('/concentration', getCostAnalysisConcentration);
router.get('/anomaly-impact', getCostAnalysisAnomalyImpact);
router.get('/filters', getFilterOptions);

export default router;







