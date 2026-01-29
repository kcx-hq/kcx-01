/**
 * Optimization Routes
 */

import express from 'express';
import { 
  getRecommendations, 
  getIdleResources,
  getOpportunities,
  getCommitmentGaps,
  getTrackerItems,
  getRightSizing
} from './optimization.controller.js';

const router = express.Router();

router.get('/recommendations', getRecommendations);
router.get('/idle-resources', getIdleResources);
router.get('/opportunities', getOpportunities);
router.get('/commitments', getCommitmentGaps);
router.get('/tracker', getTrackerItems);
router.get('/right-sizing', getRightSizing);

export default router;

