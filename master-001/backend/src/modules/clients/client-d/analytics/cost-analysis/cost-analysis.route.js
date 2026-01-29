import express from 'express';
import { getClientDCostAnalysis } from './cost-analysis.controller.js';
import { getFilterOptions } from '../../../../core-dashboard/analytics/cost-analysis/cost-analysis.controller.js';
const router = express.Router();

// All dashboard routes require login

// GET /api/dashboard/overview?provider=AWS&service=EC2
router.get('/', (_ , res) => { res.send('Client D cost-analysis API is working'); });
router.get('/analysis', getClientDCostAnalysis);
router.get('/filters', getFilterOptions);

export default router;