/**
 * Optimization Routes
 */

import express from 'express';
import { 
  getClientDRightSizing,
  getClientDCommitmentGaps,
  getClientDRecommendations,
  getClientDIdleResources
} from './optimization.controller.js';

const router = express.Router();


router.get('/idle-resources', getClientDIdleResources);
router.get('/commitments', getClientDCommitmentGaps);
router.get('/tracker', getClientDRecommendations);
router.get('/right-sizing', getClientDRightSizing);

export default router;

