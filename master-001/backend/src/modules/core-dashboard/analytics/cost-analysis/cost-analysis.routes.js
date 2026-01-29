import express from 'express';
import { getCostAnalysis, getFilterOptions } from './cost-analysis.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.get('/analysis', decodeUser, getCostAnalysis);
router.get('/filters', decodeUser, getFilterOptions);

export default router;







