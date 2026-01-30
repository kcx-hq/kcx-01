/**
 * Client-C Cost Analysis Routes
 */

import express from 'express';
import { getCostAnalysis, getFilterOptions } from './cost-analysis.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.use(decodeUser);

router.get('/', getCostAnalysis);
router.post('/', getCostAnalysis);
router.get('/filters', getFilterOptions);

export default router;
