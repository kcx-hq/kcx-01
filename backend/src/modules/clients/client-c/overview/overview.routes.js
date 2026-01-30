/**
 * Client-C Overview Routes
 */

import express from 'express';
import { 
  getOverview, 
  getAnomalies, 
  getFilters, 
} from './overview.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

// All routes require authentication
router.use(decodeUser);

router.get('/', getOverview);
router.get('/anomalies', getAnomalies);
router.get('/filters', getFilters);

export default router;
